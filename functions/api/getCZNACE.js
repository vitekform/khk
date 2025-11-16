export async function onRequest(context) {
    const { request } = context;

    try {
        const requestData = await request.json();
        const ico = requestData.ico;

        const res = await fetch(`https://aplikace.komora-khk.cz/clenska-prihlaska`, {
            method: "POST",
            headers: { "Accept": "application/json" },
            body: JSON.stringify({"acc": "getData", "ic": ico})
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();

        if (data.ico !== ico) {
            throw new Error("ICO mismatch (welcome to Czech APIs).");
        }

        const dataResp = {
            nace: data.nace,
            timestamp: Date.now()
        };

        return new Response(JSON.stringify(dataResp), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
}
