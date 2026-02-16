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
    
    // Helper function to split and pad array fields
    const splitAndPad = (value, maxLength) => {
        if (!value) return Array(maxLength).fill("");
        return value.split(',').slice(0, maxLength).map(s => s.trim()).concat(
            Array(Math.max(0, maxLength - value.split(',').length)).fill("")
        );
    };
    
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
        ...splitAndPad(data["Převažující obor činnosti dle CZ-NACE"], 10),
        ...splitAndPad(data["Země, kam exportujete/chcete exportovat"], 10),
        ...splitAndPad(data["Země, odkud importujete/chcete importovat"], 10),
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
                    (textMatch) => {
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
        const dataValue = (data["Čistý obrat (Kč)"] || "").toLowerCase();
        return dataValue === opt.toLowerCase() ? 1 : 0;
    });
    
    // Import checkboxes (7 options)
    const importOptions = ["do 1,5 mil", "1,5 – 10 mil", "10 – 50 mil", "50 – 100 mil", 
                           "100 – 300 mil", "0,3 – 1 mld", "1 mld a více"];
    mappings.import = importOptions.map(opt => {
        const dataValue = (data["Import (Kč)"] || "").toLowerCase();
        return dataValue === opt.toLowerCase() ? 1 : 0;
    });
    
    // Export checkboxes (7 options)  
    const exportOptions = ["do 1,5 mil", "1,5 – 10 mil", "10 – 50 mil", "50 – 100 mil", 
                           "100 – 300 mil", "0,3 – 1 mld", "1 mld a více"];
    mappings.export = exportOptions.map(opt => {
        const dataValue = (data["Export (Kč)"] || "").toLowerCase();
        return dataValue === opt.toLowerCase() ? 1 : 0;
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
    
    // Replace checkbox structures
    // Word checkboxes are in <w:checkBox> elements
    // If checked, they should have <w:checked w:val="1"/> 
    // If unchecked, they may not have the element at all or have w:val="0"
    docXml = docXml.replace(
        /<w:checkBox>(.*?)<\/w:checkBox>/gs,
        (match, checkboxContent) => {
            if (checkboxIndex < allCheckboxes.length) {
                const shouldBeChecked = allCheckboxes[checkboxIndex] === 1;
                checkboxIndex++;
                
                // Check if there's already a checked element
                if (/<w:checked/.test(checkboxContent)) {
                    // Update existing checked element
                    const newContent = checkboxContent.replace(
                        /<w:checked w:val="[01]"\/>/,
                        `<w:checked w:val="${shouldBeChecked ? '1' : '0'}"/>`
                    );
                    return `<w:checkBox>${newContent}</w:checkBox>`;
                } else {
                    // Add checked element if checkbox should be checked
                    if (shouldBeChecked) {
                        // Insert <w:checked w:val="1"/> after <w:sizeAuto>
                        const newContent = checkboxContent.replace(
                            /(<w:sizeAuto><\/w:sizeAuto>)/,
                            '$1<w:checked w:val="1"/>'
                        );
                        return `<w:checkBox>${newContent}</w:checkBox>`;
                    }
                }
            }
            
            return match;
        }
    );
    
    return docXml;
}
