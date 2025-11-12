import { useState } from 'react'
import './App.css'

function App() {
    const [page, setPage] = useState(0)
    const [ico, setIco] = useState("00000000")
    const [companyName, setCompanyName] = useState("")
    const [dic, setDic] = useState("")
    const [street_and_number, setStreet_and_number] = useState("")
    const [state, setState] = useState("")
    const [city, setCity] = useState("")
    const [zip, setZip] = useState("")
    const [legalForm, setLegalForm] = useState("")
    const [regDate, setRegDate] = useState("")
    const [regPlace, setRegPlace] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")

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
            setRegPlace(json.reg_place);
        })
    }

    function handleNext() {
        if (page === 0) {
            fetchDetailsFromICO();
        }
        setPage(page + 1);
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
                    {page < 2 && (
                        <button
                            type="button"
                            className="btn-next"
                            onClick={handleNext}
                        >
                            Další
                        </button>
                    )}
                    {page === 2 && (
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
                            style={{width: `${((page + 1) / 3) * 100}%`}}
                        ></div>
                    </div>
                    <p className="progress-text">Krok {page + 1} z 3</p>
                </div>
            </div>
        </div>
    </>
  )
}

export default App
