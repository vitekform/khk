import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Convert form data to PDF using pdf-lib
 * This creates a formatted PDF from the form data
 * @param {Object} data - Form data to include in the PDF
 * @param {Request} request - Request object to fetch fonts
 * @returns {Uint8Array} - The PDF as byte array
 */
export async function convertDocxToPDF(data, request) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    // Fetch DejaVu fonts and logo from public assets
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const [fontRegularResponse, fontBoldResponse, logoResponse, logo2Response] = await Promise.all([
        fetch(`${baseUrl}/fonts/DejaVuSans.ttf`),
        fetch(`${baseUrl}/fonts/DejaVuSans-Bold.ttf`),
        fetch(`${baseUrl}/khk_logo.png`),
        fetch(`${baseUrl}/khk_logo2.png`)
    ]);
    
    if (!fontRegularResponse.ok || !fontBoldResponse.ok) {
        throw new Error('Failed to load fonts');
    }
    
    const fontBytes = await fontRegularResponse.arrayBuffer();
    const fontBoldBytes = await fontBoldResponse.arrayBuffer();
    const font = await pdfDoc.embedFont(fontBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);
    
    let logoImage = null;
    if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        logoImage = await pdfDoc.embedPng(logoBytes);
    }
    
    let logo2Image = null;
    if (logo2Response.ok) {
        const logo2Bytes = await logo2Response.arrayBuffer();
        logo2Image = await pdfDoc.embedPng(logo2Bytes);
    }
    
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const fontSize = 9;
    const labelFontSize = 9;
    const sectionFontSize = 11;
    const titleFontSize = 14;
    const lineHeight = 12;
    let yPosition = height - 50;
    
    // Helper function to add a new page
    const addNewPage = () => {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
    };

    // Helper function to add text
    const addText = (text, x, y, currentFont = font, size = fontSize) => {
        page.drawText(text, {
            x,
            y,
            size,
            font: currentFont,
            color: rgb(0, 0, 0),
        });
    };

    // Draw Logos
    if (logoImage) {
        const logoDims = logoImage.scale(0.35);
        page.drawImage(logoImage, {
            x: width - logoDims.width - 50,
            y: height - logoDims.height - 30,
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    if (logo2Image) {
        const logo2Dims = logo2Image.scale(0.35);
        page.drawImage(logo2Image, {
            x: 50,
            y: height - logo2Dims.height - 30,
            width: logo2Dims.width,
            height: logo2Dims.height,
        });
    }

    yPosition = height - 100;

    // Title
    addText('PŘIHLÁŠKA ZA ČLENA KRAJSKÉ HOSPODÁŘSKÉ KOMORY', 50, yPosition, fontBold, titleFontSize);
    yPosition -= 18;
    addText('PARDUBICKÉHO KRAJE', 50, yPosition, fontBold, titleFontSize);
    yPosition -= 40;
    
    // Grid settings
    const col1X = 50;
    const col2X = 180;
    const col3X = 310;
    const col4X = 440;
    const colWidth = 120;
    
    let currentColumn = 0; // 0 or 1 (for logical columns, each having label and value)

    const addWideField = (label, value) => {
        endRow();
        const valueStr = value ? String(value) : '';
        const words = valueStr.split(' ');
        let lines = [];
        let currentLine = '';
        const maxWidth = width - col2X - 50;

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        if (yPosition - (lines.length * lineHeight) < 40) addNewPage();

        addText(label + ':', col1X, yPosition, fontBold, labelFontSize);
        for (const line of lines) {
            addText(line, col2X, yPosition, font, fontSize);
            yPosition -= lineHeight;
        }
        yPosition -= 8;
    };

    const addSection = (title) => {
        if (yPosition < 60) addNewPage();
        yPosition -= 10;
        addText(title, 50, yPosition, fontBold, sectionFontSize);
        yPosition -= 18;
        currentColumn = 0;
    };

    const addField = (label, value) => {
        const xLabel = currentColumn === 0 ? col1X : col3X;
        const xValue = currentColumn === 0 ? col2X : col4X;
        const maxWidth = colWidth;

        const valueStr = value ? String(value) : '';
        
        // Handle multi-line value
        const words = valueStr.split(' ');
        let lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        if (lines.length === 0) lines = [''];

        const fieldHeight = Math.max(1, lines.length) * lineHeight;

        if (yPosition - fieldHeight < 40) {
            addNewPage();
        }

        addText(label + ':', xLabel, yPosition, fontBold, labelFontSize);
        
        let localY = yPosition;
        for (const line of lines) {
            addText(line, xValue, localY, font, fontSize);
            localY -= lineHeight;
        }

        if (currentColumn === 0) {
            currentColumn = 1;
            // Don't decrease yPosition yet, wait for second column or end of row
        } else {
            currentColumn = 0;
            yPosition -= Math.max(1, lines.length) * lineHeight + 8;
        }
    };

    const endRow = () => {
        if (currentColumn === 1) {
            currentColumn = 0;
            yPosition -= lineHeight + 8;
        }
    };
    
    // Section I: Identifikační a kontaktní údaje
    addSection('I. IDENTIFIKAČNÍ A KONTAKTNÍ ÚDAJE');
    
    addWideField('Název firmy', data['Název Firmy']);
    addField('IČ', data['IČ']);
    addField('DIČ', data['DIČ']);
    addField('Ulice, číslo', data['Ulice a Číslo']);
    addField('Kraj', data['Kraj']);
    addField('Město', data['Město']);
    addField('PSČ', data['PSČ']);
    addField('Telefon', data['Telefon']);
    addField('E-mail', data['Email']);
    addField('Statutární zástupce', data['Statutární zástupce']);
    addField('E-mail stat. zást.', data['Email statutárního zástupce']);
    addField('Funkce stat. zást.', data['Funkce statutárního zástupce']);
    addField('Tel. stat. zást.', data['Telefon statutárního zástupce']);
    addField('Právní forma', data['Právní Forma']);
    addField('WWW stránky', data['WWW Stránky']);
    addField('Datum zápisu', data['Datum registrace v obchodním rejstříku nebo u živnostenského úřadu']);
    addField('Spisová značka', data['Spisová značka']);
    addField('ID dat. schránky', data['ID datové schránky']);
    endRow();

    addSection('KONTAKTNÍ OSOBA PRO KHK PK');
    addField('Jméno', data['Zástupce pro komunikaci s KHK PK']);
    addField('Telefon', data['Telefon zástupce pro komunikaci']);
    addField('Funkce', data['Funkce zástupce pro komunikaci']);
    addField('E-mail', data['Email zástupce pro komunikaci']);
    endRow();
    
    // Section II: Ekonomické údaje
    addSection('II. EKONOMICKÉ ÚDAJE');
    
    addField('Počet zaměstnanců', data['Množství zaměstanců']);
    addField('Čistý obrat (Kč)', data['Čistý obrat (Kč)']);
    addField('Import (Kč)', data['Import (Kč)']);
    addField('Export (Kč)', data['Export (Kč)']);
    endRow();
    
    // Section III: Popis činnosti firmy
    addSection('III. POPIS ČINNOSTI FIRMY');
    
    addWideField('CZ-NACE', data['Převažující obor činnosti dle CZ-NACE']);
    addWideField('Země exportu', data['Země, kam exportujete/chcete exportovat'] || 'Žádné');
    addWideField('Země importu', data['Země, odkud importujete/chcete exportovat'] || 'Žádné');
    addWideField('Specifikace', data['Specifikace produktů a služeb']);
    
    // Additional information
    addSection('DOPLŇUJÍCÍ INFORMACE');
    currentColumn = 0;
    
    addField('E-mail newsletter', data['Email pro newsletter']);
    addField('E-mail faktury', data['Email pro faktury']);
    addField('Monitor - denně', data['Monitor - denně']);
    addField('Monitor - týdně', data['Monitor - týdně']);
    addField('Monitor - měsíčně', data['Monitor - měsíčně']);
    addField('Datum podání', data['Datum podání']);
    endRow();
    
    return await pdfDoc.save();
}
