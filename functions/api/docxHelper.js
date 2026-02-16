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
        data["ID datové schránky"] || "",
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
    
    // Replace form field values
    // Find all form fields between "separate" and "end" markers
    let formIndex = 0;
    docXml = docXml.replace(
        /<w:fldChar w:fldCharType="separate"\/>(.*?)<w:fldChar w:fldCharType="end"\/>/gs,
        (match, fieldContent) => {
            // Check if this is a text field (has <w:t> tag)
            const hasTextField = /<w:t[^>]*>/.test(fieldContent);
            
            if (hasTextField && formIndex < formValues.length) {
                const newValue = formValues[formIndex] || "";
                formIndex++;
                
                // Replace the text content
                const newFieldContent = fieldContent.replace(
                    /<w:t[^>]*>([^<]*)<\/w:t>/,
                    (textMatch, oldText) => {
                        // Preserve the xml:space attribute if present
                        if (textMatch.includes('xml:space="preserve"')) {
                            return `<w:t xml:space="preserve">${newValue}</w:t>`;
                        }
                        return `<w:t>${newValue}</w:t>`;
                    }
                );
                
                return `<w:fldChar w:fldCharType="separate"/>${newFieldContent}<w:fldChar w:fldCharType="end"/>`;
            }
            
            return match;
        }
    );
    
    // Handle checkboxes for employee numbers, income, import, export
    const checkboxMappings = getCheckboxMappings(data);
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
    const incomeOptions = ["do 1,5 mil", "1,5 – 18 mil", "18 – 50 mil", "50 – 100 mil", 
                           "100 – 200 mil", "200 mil – 1 mld", "1 mld a více"];
    mappings.income = incomeOptions.map(opt => {
        const dataValue = data["Čistý obrat (Kč)"] || "";
        return dataValue.toLowerCase().includes(opt.toLowerCase()) ? 1 : 0;
    });
    
    // Import checkboxes (7 options)
    const importOptions = ["do 1,5 mil", "1,5 – 10 mil", "10 – 50 mil", "50 – 100 mil", 
                           "100 – 300 mil", "0,3 – 1 mld", "1 mld a více"];
    mappings.import = importOptions.map(opt => {
        const dataValue = data["Import (Kč)"] || "";
        return dataValue.toLowerCase().includes(opt.toLowerCase()) ? 1 : 0;
    });
    
    // Export checkboxes (7 options)  
    const exportOptions = ["do 1,5 mil", "1,5 – 10 mil", "10 – 50 mil", "50 – 100 mil", 
                           "100 – 300 mil", "0,3 – 1 mld", "1 mld a více"];
    mappings.export = exportOptions.map(opt => {
        const dataValue = data["Export (Kč)"] || "";
        return dataValue.toLowerCase().includes(opt.toLowerCase()) ? 1 : 0;
    });
    
    return mappings;
}

function applyCheckboxes(docXml, checkboxMappings) {
    const allCheckboxes = [
        ...checkboxMappings.employeeCount,
        ...checkboxMappings.income,
        ...checkboxMappings.import,
        ...checkboxMappings.export
    ];
    
    let checkboxIndex = 0;
    
    // Replace checkbox checked values
    // Word checkboxes are in <w:checkBox> elements with <w:checked w:val="0"/> or <w:checked w:val="1"/>
    docXml = docXml.replace(
        /<w:checkBox>(.*?)<\/w:checkBox>/gs,
        (match, checkboxContent) => {
            if (checkboxIndex < allCheckboxes.length) {
                const newValue = allCheckboxes[checkboxIndex];
                checkboxIndex++;
                
                // Replace the checked value
                const newContent = checkboxContent.replace(
                    /<w:checked w:val="[01]"\/>/,
                    `<w:checked w:val="${newValue}"/>`
                );
                
                return `<w:checkBox>${newContent}</w:checkBox>`;
            }
            
            return match;
        }
    );
    
    return docXml;
}

function applyMonitorCheckboxes(docXml, data) {
    // The monitor checkboxes should be in the last 3 checkbox positions
    // But they've already been handled by the general checkbox replacement above
    // This function is kept for potential future specific handling
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
