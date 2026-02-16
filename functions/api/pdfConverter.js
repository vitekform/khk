import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import PizZip from 'pizzip';

/**
 * Convert filled DOCX to PDF using pdf-lib
 * This extracts text from the filled DOCX and creates a formatted PDF
 * @param {ArrayBuffer} docxBuffer - The filled DOCX as ArrayBuffer
 * @param {Object} data - Original form data for reference
 * @param {Request} request - Request object to fetch fonts
 * @returns {Uint8Array} - The PDF as byte array
 */
export async function convertDocxToPDF(docxBuffer, data, request) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    // Fetch DejaVu fonts from public assets
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const fontRegularResponse = await fetch(`${baseUrl}/fonts/DejaVuSans.ttf`);
    const fontBoldResponse = await fetch(`${baseUrl}/fonts/DejaVuSans-Bold.ttf`);
    
    if (!fontRegularResponse.ok || !fontBoldResponse.ok) {
        throw new Error('Failed to load fonts');
    }
    
    const fontBytes = await fontRegularResponse.arrayBuffer();
    const fontBoldBytes = await fontBoldResponse.arrayBuffer();
    const font = await pdfDoc.embedFont(fontBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);
    
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const fontSize = 10;
    const boldFontSize = 12;
    const titleFontSize = 14;
    const lineHeight = 14;
    let yPosition = height - 50;
    
    // Helper function to add text
    const addText = (text, x, y, currentFont = font, size = fontSize) => {
        if (yPosition < 50) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
        }
        page.drawText(text, {
            x,
            y,
            size,
            font: currentFont,
            color: rgb(0, 0, 0),
        });
    };
    
    // Helper function to add a field with label and value
    const addField = (label, value) => {
        if (yPosition < 50) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
        }
        
        addText(label + ':', 50, yPosition, fontBold, boldFontSize);
        yPosition -= lineHeight + 2;
        
        const valueStr = value ? String(value) : '';
        const maxWidth = width - 100;
        const words = valueStr.split(' ');
        let line = '';
        
        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (testWidth > maxWidth && line) {
                addText(line, 70, yPosition);
                yPosition -= lineHeight;
                line = word;
            } else {
                line = testLine;
            }
        }
        
        if (line) {
            addText(line, 70, yPosition);
            yPosition -= lineHeight;
        }
        
        yPosition -= 3; // Extra spacing between fields
    };
    
    // Helper function to add section title
    const addSection = (title) => {
        if (yPosition < 70) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
        }
        yPosition -= 10;
        addText(title, 50, yPosition, fontBold, boldFontSize);
        yPosition -= lineHeight + 5;
    };
    
    // Title
    addText('PŘIHLÁŠKA ZA ČLENA KRAJSKÉ HOSPODÁŘSKÉ KOMORY', 50, yPosition, fontBold, titleFontSize);
    yPosition -= lineHeight;
    addText('PARDUBICKÉHO KRAJE', 50, yPosition, fontBold, titleFontSize);
    yPosition -= 30;
    
    // Section I: Identifikační a kontaktní údaje
    addSection('I. IDENTIFIKAČNÍ A KONTAKTNÍ ÚDAJE');
    
    addField('Název firmy', data['Název Firmy']);
    addField('IČ', data['IČ']);
    addField('DIČ', data['DIČ']);
    addField('Ulice, číslo', data['Ulice a Číslo']);
    addField('Kraj', data['Kraj']);
    addField('Město', data['Město']);
    addField('PSČ', data['PSČ']);
    addField('Telefon', data['Telefon']);
    addField('E-mail', data['Email']);
    addField('Statutární zástupce', data['Statutární zástupce']);
    addField('E-mail statutárního zástupce', data['Email statutárního zástupce']);
    addField('Funkce statutárního zástupce', data['Funkce statutárního zástupce']);
    addField('Telefon statutárního zástupce', data['Telefon statutárního zástupce']);
    addField('Právní forma', data['Právní Forma']);
    addField('WWW stránky', data['WWW Stránky']);
    addField('Datum zápisu v OR/ŽÚ', data['Datum registrace v obchodním rejstříku nebo u živnostenského úřadu']);
    addField('Spisová značka', data['Spisová značka']);
    addField('Zástupce pro komunikaci s KHK PK', data['Zástupce pro komunikaci s KHK PK']);
    addField('Telefon zástupce pro komunikaci', data['Telefon zástupce pro komunikaci']);
    addField('Funkce zástupce pro komunikaci', data['Funkce zástupce pro komunikaci']);
    addField('E-mail zástupce pro komunikaci', data['Email zástupce pro komunikaci']);
    addField('ID datové schránky', data['ID datové schránky']);
    
    // Section II: Ekonomické údaje
    addSection('II. EKONOMICKÉ ÚDAJE');
    
    addField('Počet zaměstnanců', data['Množství zaměstanců']);
    addField('Čistý obrat (Kč)', data['Čistý obrat (Kč)']);
    addField('Import (Kč)', data['Import (Kč)']);
    addField('Export (Kč)', data['Export (Kč)']);
    
    // Section III: Popis činnosti firmy
    addSection('III. POPIS ČINNOSTI FIRMY');
    
    addField('Převažující obor činnosti dle CZ-NACE', data['Převažující obor činnosti dle CZ-NACE']);
    addField('Země exportu', data['Země, kam exportujete/chcete exportovat']);
    addField('Země importu', data['Země, odkud importujete/chcete importovat']);
    addField('Specifikace produktů a služeb', data['Specifikace produktů a služeb']);
    
    // Additional information
    addSection('DOPLŇUJÍCÍ INFORMACE');
    
    addField('E-mail pro zasílání informací', data['Email pro newsletter']);
    addField('E-mail pro zasílání faktur', data['Email pro faktury']);
    addField('Monitor - denně', data['Monitor - denně']);
    addField('Monitor - týdně', data['Monitor - týdně']);
    addField('Monitor - měsíčně', data['Monitor - měsíčně']);
    addField('Datum podání', data['Datum podání']);
    
    return await pdfDoc.save();
}
