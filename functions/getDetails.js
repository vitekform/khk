export async function onRequest(context) {
    const { request } = context;

    try {
        const requestData = await request.json();
        const ico = requestData.ico;

        const res = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();

        if (data.ico !== ico) {
            throw new Error("ICO mismatch (welcome to Czech APIs).");
        }

        const dataResp = {
            name: data.obchodniJmeno,
            dic: data.dic,
            street: data.sidlo?.nazevUlice,
            address_num: data.sidlo?.cisloDomovni,
            state: data.sidlo?.nazevKraje,
            city: data.sidlo?.nazevObce,
            psc: data.sidlo?.psc,
            legal_form: data.pravniForma,
            reg_place: data.dalsiUdaje?.spisovaZnacka,
            reg_date: data.datumVzniku,
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
