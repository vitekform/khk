// Function to convert JSON object to CSV format with custom separator
function jsonToCSV(data, separator = '|') {
    const headers = Object.keys(data);

    const values = Object.values(data).map(value => {
        // Handle arrays
        if (Array.isArray(value)) {
            const joined = value.join(', ');
            return `"${joined.replace(/"/g, '""')}"`;
        }

        const stringValue = String(value);

        // Escape quotes and wrap in quotes if it contains separator or special chars
        if (
            stringValue.includes(separator) ||
            stringValue.includes('\n') ||
            stringValue.includes('"')
        ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    });

    return headers.join(separator) + '\n' + values.join(separator);
}

export async function onRequest(context) {
    const { request, env } = context;

    try {
        const requestData = await request.json();

        let toEmail = requestData.emailTo;

        delete requestData.emailTo;

        // Convert JSON to CSV with your desired separator
        const csvContent = jsonToCSV(requestData, ';'); // změň si na co chceš

        if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
            throw new Error("MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables must be configured");
        }

        const formData = new FormData();
        formData.append('from', `KHK Form System <noreply@${env.MAILGUN_DOMAIN}>`);
        formData.append('to', toEmail);
        formData.append('subject', 'Přihláška do KHK Pardubice');
        formData.append('text', 'Dobrý den, zde zasíláme vámi vyžádanou přihlášku do KHK Pardubice.');

        const bom = '\uFEFF';
        const csvBlob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
        formData.append('attachment', csvBlob, 'form-submission.csv');

        const mailgunUrl = `https://api.eu.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
        const emailResponse = await fetch(mailgunUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
            },
            body: formData
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error("Email sending failed:", errorText);
            throw new Error(`Failed to send email: ${emailResponse.status} ${errorText}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Form submitted successfully" }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        console.error("Error in submitForm:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 }
        );
    }
}
