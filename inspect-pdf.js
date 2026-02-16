import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

async function inspectPDF() {
    const pdfPath = '/home/runner/work/khk/khk/prihlaska_KOMFI_vzor HKCR.pdf';
    const existingPdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    console.log('PDF Info:');
    console.log('Pages:', pdfDoc.getPageCount());
    console.log('Title:', pdfDoc.getTitle());
    
    // Check if it has a form
    try {
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        console.log('\nForm Fields:', fields.length);
        
        fields.forEach(field => {
            const type = field.constructor.name;
            const name = field.getName();
            console.log(`- ${name} (${type})`);
        });
    } catch (e) {
        console.log('\nNo form fields found or error:', e.message);
    }
    
    // Get page info
    const pages = pdfDoc.getPages();
    pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        console.log(`\nPage ${i + 1}: ${width}x${height} pt`);
    });
}

inspectPDF().catch(console.error);
