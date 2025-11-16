// Legal forms map: code -> name
const LEGAL_FORMS = {
  "121": "Akciová společnost",
  "721": "Církve a náboženské společnosti",
  "313": "Česká národní banka",
  "362": "Česká tisková kancelář",
  "771": "Dobrovolný svazek obcí",
  "205": "Družstvo",
  "722": "Evidované církevní právnické osoby",
  "933": "Evropská družstevní společnost",
  "932": "Evropská společnost",
  "931": "Evropské hospodářské zájmové sdružení",
  "941": "Evropské seskupení pro územní spolupráci",
  "152": "Garanční fond obchodníků s cennými papíry",
  "761": "Honební společenstvo",
  "151": "Komoditní burza",
  "745": "Komora (hospodářská, agrární)",
  "804": "Kraj",
  "811": "Městská část / městský obvod",
  "921": "Mezinárodní nevládní organizace",
  "907": "Mezinárodní odborová organizace",
  "908": "Mezinárodní organizace zaměstnavatelů",
  "951": "Mezinárodní vojenská organizace",
  "117": "Nadace",
  "118": "Nadační fond",
  "302": "Národní podnik",
  "801": "Obec",
  "141": "Obecně prospěšná společnost",
  "707": "Odborová organizace",
  "501": "Odštěpný závod",
  "425": "Odštěpný závod zahraniční fyzické osoby",
  "421": "Odštěpný závod zahraniční právnické osoby",
  "708": "Organizace zaměstnavatelů",
  "922": "Organizační jednotka mezinárodní nevládní organizace",
  "734": "Organizační jednotka zvláštní organizace",
  "325": "Organizační složka státu",
  "423": "Organizační složka zahraniční nadace",
  "422": "Organizační složka zahraničního nadačního fondu",
  "736": "Pobočný spolek",
  "100": "Podnikající fyzická osoba tuzemská",
  "711": "Politická strana / hnutí",
  "960": "Právnická osoba zřízená zvláštním zákonem",
  "331": "Příspěvková organizace",
  "353": "Rada pro veřejný dohled nad auditem",
  "805": "Regionální rada",
  "741": "Samosprávná stavovská organizace",
  "521": "Samostatná drobná provozovna",
  "145": "Společenství vlastníků jednotek",
  "113": "Společnost komanditní",
  "112": "Společnost s ručením omezeným",
  "706": "Spolek",
  "352": "Správa železniční dopravní cesty",
  "326": "Stálý rozhodčí soud",
  "381": "Státní fond ze zákona",
  "382": "Státní fond nezapisující se do OR",
  "301": "Státní podnik",
  "332": "Státní příspěvková organizace",
  "723": "Svazy církví a náboženských společností",
  "961": "Svěřenský fond",
  "641": "Školská právnická osoba",
  "161": "Ústav",
  "111": "Veřejná obchodní společnost",
  "661": "Veřejná výzkumná instituce",
  "361": "Veřejnoprávní instituce",
  "525": "Vnitřní organizační jednotka organizační složky státu",
  "392": "Všeobecná zdravotní pojišťovna",
  "601": "Vysoká škola",
  "424": "Zahraniční fyzická osoba",
  "936": "Zahraniční pobočný spolek",
  "906": "Zahraniční spolek",
  "962": "Zahraniční svěřenský fond",
  "751": "Zájmové sdružení právnických osob",
  "426": "Zastoupení zahraniční banky",
  "391": "Zdravotní pojišťovna (mimo VZP)",
  "704": "Zvláštní organizace pro zastoupení českých zájmů"
};

/**
 * Resolve a legal form code to its name
 * @param {string} code - The legal form code (e.g., "112")
 * @returns {string} The legal form name (e.g., "Společnost s ručením omezeným")
 */
function resolveLegalForm(code) {
  return LEGAL_FORMS[code] || code;
}

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
            legal_form: resolveLegalForm(data.pravniForma),
            reg_date: data.datumVzniku,
            znacka: data.dalsiUdaje?.find(u => u.spisovaZnacka)?.spisovaZnacka,
            czNace: data.czNace || [],
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
