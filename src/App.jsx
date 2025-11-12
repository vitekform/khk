import { useState } from 'react'
import './App.css'

function App() {

    const MAX_PAGES = 8;

    const [page, setPage] = useState(0)
    const [ico, setIco] = useState("00000000")
    const [companyName, setCompanyName] = useState("")
    const [dic, setDic] = useState("")
    const [street_and_number, setStreet_and_number] = useState("")
    const [state, setState] = useState("")
    const [city, setCity] = useState("")
    const [zip, setZip] = useState("")
    const [regDate, setRegDate] = useState("")
    const [regPlace, setRegPlace] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [phoneStatutary, setPhoneStatutary] = useState("")
    const [emailStatutary, setEmailStatutary] = useState("")
    const [functionStatutary, setFunctionStatutary] = useState("")
    const [legalForm, setLegalForm] = useState("")
    const [web, setWeb] = useState("none")
    const [mark, setMark] = useState("") // spisová značka
    const [nameStatuary, setNameStatuary] = useState("")
    const [nameMeeting, setNameMeeting] = useState("")
    const [phoneMeeting, setPhoneMeeting] = useState("")
    const [emailMeeting, setEmailMeeting] = useState("")
    const [functionMeeting, setFunctionMeeting] = useState("")
    const [employeeNum, setEmployeeNum] = useState("0")
    const [income, setIncome] = useState("0")
    const [import_, setImport] = useState("0")
    const [export_, setExport] = useState("0")

    function fetchDetailsFromICO() {
        fetch("/api/getDetails", {body: JSON.stringify({"ico": ico}), method: "POST", headers: {
            "Content-Type": "application/json"
            }}).then(async (res) => {
            let json = await res.json();
            setCompanyName(json.name);
            setDic(json.dic);
            let ulice = json.street;
            let cislo = json.address_num;
            setStreet_and_number(ulice + " " + cislo);
            setState(json.state);
            setCity(json.city);
            setZip(json.psc);
            setLegalForm(json.legal_form);
            setRegDate(json.reg_date);
            setMark(json.mark);
        })
    }

    function handleNext() {
        // check if all fields are filled (marked as required in the input)
        let invalid = false;
        document.querySelectorAll('.form-content input').forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                invalid = true;
            }
        });

        if (!invalid) {
            if (page === 0) {
                fetchDetailsFromICO();
            }
            setPage(page + 1);
        }
        else {
            alert("Prosím prvně vyplňte nutná pole!");
        }

    }

    function handleBack() {
        setPage(page - 1);
    }

    function getHTMLContent(page) {
        if (page === 0) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Prosím zadejte vaše IČO</label>
                        <input
                            type="text"
                            onChange={e => {setIco(e.target.value)}}
                            className="answer-input"
                            inputMode="numeric"
                            pattern="\d{8}"
                            maxLength="8"
                            placeholder="Vaše IČO"
                            required
                            value={ico}
                        />
                    </div>
                </>
            )
        }
        else if (page === 1) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Jméno Firmy</label>
                        <input
                        type="text"
                        onChange={e => {setCompanyName(e.target.value)}}
                        required
                        placeholder="Jméno Firmy"
                        value={companyName}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">DIČ Firmy</label>
                        <input
                            type="text"
                            onChange={e => {setDic(e.target.value)}}
                            required
                            placeholder="DIČ Firmy"
                            value={dic}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Ulice a Číslo popisné</label>
                        <input
                            type="text"
                            onChange={e => {setStreet_and_number(e.target.value)}}
                            required
                            placeholder="Ulice a Číslo popisné"
                            value={street_and_number}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kraj</label>
                        <input
                            type="text"
                            onChange={e => {setState(e.target.value)}}
                            required
                            placeholder="Kraj"
                            value={state}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Obec</label>
                        <input
                            type="text"
                            onChange={e => {setCity(e.target.value)}}
                            required
                            placeholder="Obec"
                            value={city}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">PSČ</label>
                        <input
                            type="text"
                            onChange={e => {setZip(e.target.value)}}
                            required
                            placeholder="PSČ"
                            value={zip}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 2) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Kontaktní Telefon</label>
                        <input
                            type="tel"
                            onChange={e => {setPhone(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phone}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní E-Mail</label>
                        <input
                            type="email"
                            onChange={e => {setEmail(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={email}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 3) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Jméno Statutárního Zástupce</label>
                        <input
                            type={"text"}
                            onChange={e => {setNameStatuary(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameStatuary}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní Telefon Statutárního Zástupce</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneStatutary(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneStatutary}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní E-Mail Statutárního Zástupce</label>
                        <input
                            type="email"
                            onChange={e => {setEmailStatutary(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailStatutary}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce Statutárního Zástupce</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionStatutary(e.target.value)}}
                            required
                            placeholder="Funkce Statutárního Zástupce"
                            value={functionStatutary}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 4) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Právní Forma</label>
                        <input
                            type="text"
                            onChange={e => {setLegalForm(e.target.value)}}
                            required
                            placeholder="Právní Forma"
                            value={legalForm}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 5) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Vaše webové stránky</label>
                        <input
                            type={"url"}
                            onChange={e => {setWeb(e.target.value)}}
                            defaultValue={"none"}
                            placeholder="URL vašich webových stránek"
                            value={web}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 6) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Datum Registrace v obchodním rejstříku nebo u živnostenského úřadu</label>
                        <p>Ve formátu dd-mm-yyyy</p>
                        <input
                            type={"date"}
                            onChange={e => {setRegDate(e.target.value)}}
                            placeholder="Datum Registrace"
                            value={regDate}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Místo Registrace v obchodním rejstříku nebo u živnostenského úřadu</label>
                        <input
                            type={"text"}
                            onChange={e => {setRegPlace(e.target.value)}}
                            placeholder="Místo Registrace"
                            value={regPlace}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Spisová Značka</label>
                        <input
                            type={"text"}
                            onChange={e => {setMark(e.target.value)}}
                            placeholder="Spisová Značka"
                            value={mark}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 7) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Jméno Zástupce pro jednání</label>
                        <input
                            type={"text"}
                            onChange={e => {setNameMeeting(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameMeeting}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní Telefon Zástupce pro jednání</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneMeeting(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneMeeting}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní E-Mail Zástupce pro jednání</label>
                        <input
                            type="email"
                            onChange={e => {setEmailMeeting(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailMeeting}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce Zástupce pro jednání</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionMeeting(e.target.value)}}
                            required
                            placeholder="Funkce Zástupce pro jednání"
                            value={functionMeeting}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 8) {
            return (
                <>
                    <div className="question-card">
                        <label className="question">Počet Zaměstnanců</label>
                        <input
                            type={"radio"}
                            onChange={e => {setEmployeeNum(e.target.value)}}
                            value="0">
                            Bez Zaměstnanců
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setEmployeeNum(e.target.value)}}
                            value="1">
                            1-9 Zaměstnanců
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setEmployeeNum(e.target.value)}}
                            value="2">
                            10-49 Zaměstnanců
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setEmployeeNum(e.target.value)}}
                            value="3">
                            50-249 Zaměstnanců
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setEmployeeNum(e.target.value)}}
                            value="4">
                            250 až 999 Zaměstnanců
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setEmployeeNum(e.target.value)}}
                            value="5">
                            Více než 1 000 Zaměstnanců
                        </input>
                    </div>
					<div className="question-card">
                        <label className="question">Čistý Obrat (Kč)</label>
                        <input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="0">
                            do 1,5 mil
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="1">
                            1,5 - 18 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="2">
                            18 - 50 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="3">
                            50 - 100 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="4">
                            100 - 200 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="5">
                            200 miliónů - 1 miliarda
                        </input>
						<input
                            type={"radio"}
                            onChange={e => {setIncome(e.target.value)}}
                            value="6">
                            Více než 1 miliarda
                        </input>
                    </div>
					<div className="question-card">
                        <label className="question">Import (Kč)</label>
                        <input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="0">
                            do 1,5 mil
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="1">
                            1,5 - 18 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="2">
                            18 - 50 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="3">
                            50 - 100 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="4">
                            100 - 300 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="5">
                            300 miliónů - 1 miliarda
                        </input>
						<input
                            type={"radio"}
                            onChange={e => {setImport(e.target.value)}}
                            value="6">
                            Více než 1 miliarda
                        </input>
                    </div>
					<div className="question-card">
                        <label className="question">Export (Kč)</label>
                        <input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="0">
                            do 1,5 mil
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="1">
                            1,5 - 18 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="2">
                            18 - 50 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="3">
                            50 - 100 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="4">
                            100 - 300 miliónů
                        </input>
                        <input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="5">
                            300 miliónů - 1 miliarda
                        </input>
						<input
                            type={"radio"}
                            onChange={e => {setExport(e.target.value)}}
                            value="6">
                            Více než 1 miliarda
                        </input>
                    </div>
                </>
            )
        }
    }
  return (
    <>
        <div className="form-wrapper">
            <div className="form-container">
                <div className="form-header">
                    <h1 className="form-title">Registrační formulář</h1>
                    <p className="form-description">Vyplňte prosím všechny údaje o vaší firmě</p>
                </div>

                <div className="form-content">
                    {getHTMLContent(page)}
                </div>

                <div className="form-navigation">
                    {page > 0 && (
                        <button
                            type="button"
                            className="btn-back"
                            onClick={handleBack}
                        >
                            Zpět
                        </button>
                    )}
                    {page < MAX_PAGES && (
                        <button
                            type="button"
                            className="btn-next"
                            onClick={handleNext}
                        >
                            Další
                        </button>
                    )}
                    {page === MAX_PAGES && (
                        <button
                            type="submit"
                            className="btn-submit"
                        >
                            Odeslat
                        </button>
                    )}
                </div>

                <div className="form-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{width: `${((page + 1) / MAX_PAGES) * 100}%`}}
                        ></div>
                    </div>
                    <p className="progress-text">Krok {page + 1} z {MAX_PAGES}</p>
                </div>
            </div>
        </div>
    </>
  )
}

export default App
