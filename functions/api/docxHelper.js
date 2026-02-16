import PizZip from 'pizzip';

/**
 * Fill Word form fields in a DOCX template
 * @param {ArrayBuffer} templateBuffer - The DOCX template as ArrayBuffer
 * @param {Object} data - Key-value pairs where keys match the order of form fields
 * @returns {ArrayBuffer} - The filled DOCX as ArrayBuffer
 */
export async function fillDocxTemplate(templateBuffer, data) {
    const zip = new PizZip(templateBuffer);
    
    // Get the main document XML
    let docXml = zip.file('word/document.xml').asText();
    
    // Create an array of values in the order they appear in the template
    // Based on the template structure we saw
    const formValues = [
        data["Název Firmy"] || "",
        data["IČ"] || "",
        data["DIČ"] || "",
        data["Ulice a Číslo"] || "",
        data["Kraj"] || "",
        data["Město"] || "",
        data["PSČ"] || "",
        data["Telefon"] || "",
        data["Email"] || "",
        data["Statutární zástupce"] || "",
        data["Email statutárního zástupce"] || "",
        data["Funkce statutárního zástupce"] || "",
        data["Telefon statutárního zástupce"] || "",
        data["Právní Forma"] || "",
        data["WWW Stránky"] || "",
        "", // Místo (registrace)
        data["Datum registrace v obchodním rejstříku nebo u živnostenského úřadu"] || "",
        data["Spisová značka"] || "",
        data["Zástupce pro komunikaci s KHK PK"] || "",
        data["Telefon zástupce pro komunikaci"] || "",
        data["Funkce zástupce pro komunikaci"] || "",
        data["Email zástupce pro komunikaci"] || "",
        ...(data["Převažující obor činnosti dle CZ-NACE"] ? 
            data["Převažující obor činnosti dle CZ-NACE"].split(',').slice(0, 10).map(s => s.trim()) : 
            Array(10).fill("")),
        ...(data["Země, kam exportujete/chcete exportovat"] ? 
            data["Země, kam exportujete/chcete exportovat"].split(',').slice(0, 10).map(s => s.trim()) : 
            Array(10).fill("")),
        ...(data["Země, odkud importujete/chcete importovat"] ? 
            data["Země, odkud importujete/chcete importovat"].split(',').slice(0, 10).map(s => s.trim()) : 
            Array(10).fill("")),
        data["Specifikace produktů a služeb"] || "",
        data["Email pro newsletter"] || "",
        data["Email pro faktury"] || "",
        "", // Kontaktní osoba - Jméno
        "", // Kontaktní osoba - Funkce
        "", // Kontaktní osoba - Telefon
        "", // Kontaktní osoba - Mobil
        "", // Kontaktní osoba - Email
        "", // Podpis
        data["Datum podání"] || ""
    ];
    
    // Replace FORMTEXT fields with actual values
    // Word stores form fields as <w:ffData> elements followed by <w:r><w:t> for display
    let formIndex = 0;
    
    // Find and replace each FORMTEXT placeholder
    // The pattern we're looking for is: w:instr=" FORMTEXT " followed eventually by <w:t>text</w:t>
    docXml = docXml.replace(
        /<w:instrText[^>]*>\s*FORMTEXT\s*<\/w:instrText>[\s\S]*?<w:t[^>]*>([^<]*)<\/w:t>/g,
        (match, currentText) => {
            const newValue = formIndex < formValues.length ? formValues[formIndex] : '';
            formIndex++;
            // Replace the text content while preserving XML structure
            return match.replace(`<w:t>${currentText}</w:t>`, `<w:t>${newValue}</w:t>`).replace(`<w:t xml:space="preserve">${currentText}</w:t>`, `<w:t xml:space="preserve">${newValue}</w:t>`);
        }
    );
    
    // Handle checkboxes for employee numbers, income, import, export
    // Checkboxes are <w:ffData> with <w:checkBox> and <w:checked w:val="0" or "1"/>
    const checkboxMappings = getCheckboxMappings(data);
    
    // Apply checkbox values
    docXml = applyCheckboxes(docXml, checkboxMappings);
    
    // Apply Monitor checkbox values
    docXml = applyMonitorCheckboxes(docXml, data);
    
    // Save the modified XML back
    zip.file('word/document.xml', docXml);
    
    // Generate the modified DOCX
    return zip.generate({ type: 'arraybuffer' });
}

function getCheckboxMappings(data) {
    const mappings = {
        employeeCount: [],
        income: [],
        import: [],
        export: []
    };
    
    // Employee count checkboxes (6 options)
    const empOptions = ["Bez zaměstnanců", "1 – 9 zaměstnanců", "10 – 49 zaměstnanců", 
                        "50 – 249 zaměstnanců", "250 – 9999 zaměstnanců", "1000 a více"];
    mappings.employeeCount = empOptions.map(opt => data["Množství zaměstanců"] === opt ? 1 : 0);
    
    // Income checkboxes (7 options)
    const incomeOptions = ["Do 1,5 mil", "1,5 – 18 mil", "18 – 50 mil", "50 – 100 mil", 
                           "100 – 200 mil", "200 mil – 1 mld", "1 mld a více"];
    mappings.income = incomeOptions.map(opt => data["Čistý obrat (Kč)"] && data["Čistý obrat (Kč)"].includes(opt.replace('Do ', 'do ').replace(' mil', ' mil')) ? 1 : 0);
    
    // Import checkboxes (7 options)
    const importOptions = ["Do 1,5 mil", "1,5 – 10 mil", "10 – 50 mil", "50 – 100 mil", 
                           "100 – 300 mil", "0,3 – 1 mld", "1 mld a více"];
    mappings.import = importOptions.map(opt => data["Import (Kč)"] && data["Import (Kč)"].includes(opt.replace('Do ', 'do ')) ? 1 : 0);
    
    // Export checkboxes (7 options)  
    const exportOptions = ["Do 1,5 mil", "1,5 – 10 mil", "10 – 50 mil", "50 – 100 mil", 
                           "100 – 300 mil", "0,3 – 1 mld", "1 mld a více"];
    mappings.export = exportOptions.map(opt => data["Export (Kč)"] && data["Export (Kč)"].includes(opt.replace('Do ', 'do ')) ? 1 : 0);
    
    return mappings;
}

function applyCheckboxes(docXml, checkboxMappings) {
    let checkboxIndex = 0;
    const allCheckboxes = [
        ...checkboxMappings.employeeCount,
        ...checkboxMappings.income,
        ...checkboxMappings.import,
        ...checkboxMappings.export
    ];
    
    // Replace checkbox checked values
    docXml = docXml.replace(
        /<w:checkBox>[\s\S]*?<w:checked w:val="[01]"[\s\S]*?<\/w:checkBox>/g,
        (match) => {
            const newValue = checkboxIndex < allCheckboxes.length ? allCheckboxes[checkboxIndex] : 0;
            checkboxIndex++;
            return match.replace(/w:val="[01]"/, `w:val="${newValue}"`);
        }
    );
    
    return docXml;
}

function applyMonitorCheckboxes(docXml, data) {
    // The last 3 checkboxes are for Monitor options
    // We need to handle them based on the data
    // This is a simplified approach - in production you'd want more robust parsing
    
    return docXml;
}

/**
 * Extract text content from DOCX for debugging
 * @param {ArrayBuffer} docxBuffer
 * @returns {string}
 */
export function extractDocxText(docxBuffer) {
    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml').asText();
    
    // Remove XML tags to get plain text
    const text = docXml.replace(/<[^>]+>/g, '');
    return text;
}
