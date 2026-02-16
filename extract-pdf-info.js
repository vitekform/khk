import { readFileSync, writeFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

async function extractInfo() {
    const pdfPath = '/home/runner/work/khk/khk/prihlaska_KOMFI_vzor HKCR.pdf';
    const existingPdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    console.log('PDF Analysis:');
    console.log('='.repeat(60));
    console.log('Pages:', pdfDoc.getPageCount());
    console.log('Creator:', pdfDoc.getCreator());
    console.log('Producer:', pdfDoc.getProducer());
    console.log('Subject:', pdfDoc.getSubject());
    console.log('Keywords:', pdfDoc.getKeywords());
    
    // Get page info
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    console.log(`\nPage Dimensions: ${width}x${height} pt (${(width/72).toFixed(2)}" x ${(height/72).toFixed(2)}")`);
    
    // Try to get resources
    console.log('\nPage Resources:');
    try {
        const dict = page.node.dict;
        const resources = dict.lookup('Resources');
        console.log('Resources found:', resources ? 'Yes' : 'No');
        
        if (resources) {
            // Check for XObject (images)
            const xobject = resources.lookup('XObject');
            if (xobject) {
                const xobjectKeys = xobject.context.enumerateIndirectObjects();
                console.log('XObjects (images/forms):', xobjectKeys.length > 0 ? 'Found' : 'None');
            }
            
            // Check for fonts
            const fonts = resources.lookup('Font');
            if (fonts) {
                console.log('Fonts: Found');
            }
        }
    } catch (e) {
        console.log('Error examining resources:', e.message);
    }
    
    // Copy template to check if it works
    const copiedDoc = await PDFDocument.create();
    const [copiedPage] = await copiedDoc.copyPages(pdfDoc, [0]);
    copiedDoc.addPage(copiedPage);
    
    const copiedBytes = await copiedDoc.save();
    writeFileSync('/tmp/template-copy.pdf', copiedBytes);
    console.log('\nTemplate copy created at /tmp/template-copy.pdf');
    console.log('This confirms we can load and manipulate the template.');
}

extractInfo().catch(console.error);
