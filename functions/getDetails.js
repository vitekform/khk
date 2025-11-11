export async function onRequest(context) {

    const { request, env } = context;

    const requestData = await request.json();
    const ico = requestData.ico;

    // Fetch data from ARES

    fetch('https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/' + ico, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('JSON odpověď:', data);
            if (data.ico !== ico) {
                // How the f*** did this happen?
                throw new Error('Could not obtain data because ICO mismatch happened. Who knows why...');
            }
            let companyName = data.obchodniJmeno;
            let dic = data.dic;
            let ulice = data.sidlo.nazevUlice;
            let cisloPopisne = data.sidlo.cisloDomovni;
            let kraj = data.sidlo.nazevKraje;
            let mesto = data.sidlo.nazevObce;
            let psc = data.sidlo.psc;
            let pravniForma = data.pravniForma;
            let regPlace = data.dalsiUdaje.spisovaZnacka;
            let regDate = data.datumVzniku;
            const dataResp = { "name": companyName, "dic": dic, "street": ulice, "address_num": cisloPopisne, "state": kraj, "city": mesto, "psc": psc, "legal_form": pravniForma, "reg_place": regPlace, "reg_date": regDate, "timestamp": Date.now() }
            return new Response(JSON.stringify(dataResp));
        })
        .catch(error => {
            return new Response(JSON.stringify(error));
        });
}