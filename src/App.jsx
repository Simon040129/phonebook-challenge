import { useEffect, useMemo, useState } from "react";
import "./App.css";
import fleetInsignia from "./assets/fleet-insignia.svg";

const createAvatarUrl = (seed) =>
    `https://i.pravatar.cc/300?u=${encodeURIComponent(String(seed ?? "fleet"))}`;

function normalizeContact(rawContact = {}, index = 0) {
    const id = rawContact.id ?? Date.now() + index;
    const name = rawContact.name?.toString().trim() || "Unknown Officer";
    const email = rawContact.email?.toString().trim() || "";
    const phone = rawContact.phone?.toString().trim() || "";
    const title = rawContact.title ?? "Mission Specialist";
    const photo =
        rawContact.photo ??
        createAvatarUrl(email || name || `${id}-${index ?? 0}`);
    const photoAlt =
        rawContact.photoAlt ?? `Portrait of ${name}${title ? ` – ${title}` : ""}`;

    return {
        ...rawContact,
        id,
        name,
        title,
        phone,
        email,
        photo,
        photoAlt,
    };
}

const FALLBACK_CONTACTS = [
    {
        id: 1,
        name: "Captain Lyra Orion",
        title: "Fleet Captain",
        phone: "(555) 470-1020",
        email: "lyra.orion@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=11",
        photoAlt: "Portrait of Captain Lyra Orion in a navy flight suit",
    },
    {
        id: 2,
        name: "Navigator Juno Hale",
        title: "Chief Navigator",
        phone: "(555) 470-1021",
        email: "juno.hale@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=12",
        photoAlt: "Portrait of Navigator Juno Hale reviewing a star chart",
    },
    {
        id: 3,
        name: "Dr. Elio Castor",
        title: "Astrobiologist",
        phone: "(555) 470-1022",
        email: "elio.castor@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=13",
        photoAlt: "Portrait of Dr. Elio Castor in a lab coat",
    },
    {
        id: 4,
        name: "Commander Vega Sol",
        title: "Mission Control",
        phone: "(555) 470-1023",
        email: "vega.sol@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=14",
        photoAlt: "Portrait of Commander Vega Sol at a command console",
    },
    {
        id: 5,
        name: "Technician Mira Quill",
        title: "Systems Technician",
        phone: "(555) 470-1024",
        email: "mira.quill@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=15",
        photoAlt: "Portrait of Technician Mira Quill smiling with a toolkit",
    },
    {
        id: 6,
        name: "Scout Orion Pace",
        title: "Deep Space Scout",
        phone: "(555) 470-1025",
        email: "orion.pace@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=16",
        photoAlt: "Portrait of Scout Orion Pace in an exploration suit",
    },
    {
        id: 7,
        name: "Engineer Tamsin Flux",
        title: "Propulsion Engineer",
        phone: "(555) 470-1026",
        email: "tamsin.flux@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=17",
        photoAlt: "Portrait of Engineer Tamsin Flux wearing safety goggles",
    },
    {
        id: 8,
        name: "Archivist Lior Zenith",
        title: "Galactic Archivist",
        phone: "(555) 470-1027",
        email: "lior.zenith@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=18",
        photoAlt: "Portrait of Archivist Lior Zenith in front of data displays",
    },
    {
        id: 9,
        name: "Specialist Kaia Drift",
        title: "Communications Specialist",
        phone: "(555) 470-1028",
        email: "kaia.drift@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=19",
        photoAlt: "Portrait of Specialist Kaia Drift wearing a headset",
    },
    {
        id: 10,
        name: "Cadet Rian Pulse",
        title: "Navigation Cadet",
        phone: "(555) 470-1029",
        email: "rian.pulse@stellarhq.io",
        photo: "https://i.pravatar.cc/150?img=20",
        photoAlt: "Portrait of Cadet Rian Pulse ready for training",
    },
];

const INITIAL_CONTACTS = FALLBACK_CONTACTS.map((contact, index) =>
    normalizeContact(contact, index)
);

const App = () => {
    const [contacts, setContacts] = useState(INITIAL_CONTACTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isActive = true;

        const fetchContacts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch("/data/contacts.json");
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                const data = await response.json();
                if (!isActive) {
                    return;
                }

                if (Array.isArray(data) && data.length > 0) {
                    const normalized = data.map((contact, index) =>
                        normalizeContact(contact, index)
                    );
                    setContacts(normalized);
                } else {
                    setContacts(INITIAL_CONTACTS);
                }
            } catch (err) {
                if (!isActive) {
                    return;
                }
                console.error("Failed to fetch contacts", err);
                setError("Unable to sync roster data. Showing fallback crew.");
                setContacts(INITIAL_CONTACTS);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchContacts();

        return () => {
            isActive = false;
        };
    }, []);

    const [query, setQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [currentPage, setCurrentPage] = useState(0);

    const visibleContacts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const numericQuery = normalizedQuery.replace(/[^\d+]/g, "");

        if (!normalizedQuery) {
            return contacts;
        }

        return contacts.filter((contact) => {
            const matchesName = contact.name.toLowerCase().includes(normalizedQuery);
            const matchesPhone = numericQuery
                ? contact.phone.replace(/[^\d+]/g, "").includes(numericQuery)
                : false;

            return matchesName || matchesPhone;
        });
    }, [contacts, query]);

    useEffect(() => {
        setCurrentPage((prev) => {
            if (visibleContacts.length === 0) {
                return 0;
            }
            return Math.min(prev, visibleContacts.length - 1);
        });
    }, [visibleContacts]);

    useEffect(() => {
        setCurrentPage(0);
    }, [query, viewMode]);

    const currentContact =
        viewMode === "single" && visibleContacts.length > 0
            ? visibleContacts[currentPage]
            : null;

    const [form, setForm] = useState({ name: "", phone: "", email: "" });
    const [formErrors, setFormErrors] = useState({});

    const validateField = (field, value) => {
        const trimmed = value.trim();
        switch (field) {
            case "name": {
                if (!trimmed) {
                    return "Name is required.";
                }
                if (trimmed.length < 2) {
                    return "Name must be at least 2 characters.";
                }
                return "";
            }
            case "phone": {
                if (!trimmed) {
                    return "Phone is required.";
                }
                const digits = trimmed.replace(/[^\d+]/g, "");
                if (digits.length < 7) {
                    return "Enter a valid phone number.";
                }
                return "";
            }
            case "email": {
                if (!trimmed) {
                    return "Email is required.";
                }
                if (!trimmed.includes("@")) {
                    return "Email must include @.";
                }
                return "";
            }
            default:
                return "";
        }
    };

    const validateForm = (values) => {
        const nextErrors = {};
        ["name", "phone", "email"].forEach((field) => {
            const error = validateField(field, values[field]);
            if (error) {
                nextErrors[field] = error;
            }
        });
        return nextErrors;
    };

    const handleInputChange = (field) => (event) => {
        const { value } = event.target;
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => {
            const { [field]: _removed, ...rest } = prev;
            const error = validateField(field, value);
            return error ? { ...rest, [field]: error } : rest;
        });
    };

    function handleSubmit(e) {
        e.preventDefault();
        const validation = validateForm(form);
        setFormErrors(validation);
        if (Object.keys(validation).length > 0) {
            return;
        }

        const newContact = normalizeContact({
            id: Date.now(),
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            title: "Guest Officer",
        });

        setContacts((prev) => [newContact, ...prev]);
        setForm({ name: "", phone: "", email: "" });
        setFormErrors({});
        setCurrentPage(0);
    }

    const handlePrev = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentPage((prev) =>
            Math.min(prev + 1, Math.max(visibleContacts.length - 1, 0))
        );
    };

    const handleViewToggle = (mode) => {
        if (mode === viewMode) {
            return;
        }
        setViewMode(mode);
    };

    const renderContactCard = (contact, variant = "grid") => (
        <article
            className={`contact-card contact-card--${variant}`}
            aria-labelledby={`contact-${contact.id}-name`}
        >
            <img
                className={`contact-card__photo contact-card__photo--${variant}`}
                src={contact.photo}
                alt={contact.photoAlt}
                width="150"
                height="150"
                loading="lazy"
            />
            <div className={`contact-card__content contact-card__content--${variant}`}>
                <h3
                    id={`contact-${contact.id}-name`}
                    className="contact-card__name"
                    data-testid="contact-name"
                >
                    {contact.name}
                </h3>
                {contact.title ? (
                    <p className="contact-card__title">{contact.title}</p>
                ) : null}
                <dl className="contact-card__details">
                    <dt className="contact-card__label">Comms</dt>
                    <dd className="contact-card__value">
                        <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
                            {contact.phone}
                        </a>
                    </dd>
                    <dt className="contact-card__label">Signal</dt>
                    <dd className="contact-card__value">
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </dd>
                </dl>
            </div>
        </article>
    );

    const isSingleView = viewMode === "single";
    const hasContacts = visibleContacts.length > 0;
    const canGoPrev = currentPage > 0;
    const canGoNext = currentPage < visibleContacts.length - 1;
    const paginationTotals = {
        current: hasContacts ? currentPage + 1 : 0,
        total: visibleContacts.length,
    };

    const paginationMessage = hasContacts
        ? isSingleView
            ? `Officer ${paginationTotals.current} of ${paginationTotals.total}`
            : `${paginationTotals.total} officers in view`
        : "No officers to display";

    return (
        <main className="page" data-testid="page-root">
            <header className="page__header">
                <div className="page__masthead">
                    <img
                        src={fleetInsignia}
                        alt="Stellar Fleet Command insignia"
                        className="page__insignia"
                    />
                    <div className="page__titles">
                        <p className="page__eyebrow">Stellar Fleet Command • Roster</p>
                        <h1 className="page__title">Stellar Fleet Comms Directory</h1>
                        <p className="page__subtitle">
                            Maintain the latest comms intel for every officer cleared
                            for deep-space expeditions.
                        </p>
                    </div>
                </div>

                <dl className="page__meta">
                    <div className="page__meta-pair">
                        <dt>Sector</dt>
                        <dd>Andromeda Gate</dd>
                    </div>
                    <div className="page__meta-pair">
                        <dt>Last Sync</dt>
                        <dd>Stardate 99274.5</dd>
                    </div>
                    <div className="page__meta-pair">
                        <dt>Clearance</dt>
                        <dd>Command</dd>
                    </div>
                </dl>
            </header>

            <section className="search" aria-labelledby="search-heading">
                <h2 id="search-heading">Search the Roster</h2>
                <p className="search__intro">
                    Filter by name or call sign to locate a crew member before
                    initiating comms.
                </p>
                <div className="search__controls">
                    <label htmlFor="search-input">Search</label>
                    <input
                        id="search-input"
                        type="search"
                        placeholder="Search by name or call sign"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        data-testid="search-input"
                    />
                </div>

                <p
                    className="search__results"
                    data-testid="results-count"
                    aria-live="polite"
                >
                    Showing {visibleContacts.length}{" "}
                    {visibleContacts.length === 1 ? "result" : "results"}
                    {loading ? " (loading...)" : ""}
                    {error ? ` (error: ${error})` : ""}
                </p>
            </section>

            <section className="contacts" aria-labelledby="contacts-heading">
                <div className="contacts__header">
                    <h2 id="contacts-heading">Crew Roster</h2>
                    <div className="view-toggle" role="group" aria-label="Roster view mode">
                        <button
                            type="button"
                            className={`view-toggle__btn${
                                isSingleView ? "" : " is-inactive"
                            }`}
                            aria-pressed={isSingleView}
                            onClick={() => handleViewToggle("single")}
                        >
                            Single Officer
                        </button>
                        <button
                            type="button"
                            className={`view-toggle__btn${
                                viewMode === "grid" ? "" : " is-inactive"
                            }`}
                            aria-pressed={viewMode === "grid"}
                            onClick={() => handleViewToggle("grid")}
                        >
                            Squadron Grid
                        </button>
                    </div>
                </div>

                {isSingleView ? (
                    hasContacts ? (
                        <div className="contact-profile" data-testid="single-contact">
                            {renderContactCard(currentContact, "single")}
                        </div>
                    ) : (
                        <p className="contacts__empty">
                            No crew members match that call sign. Try a different search.
                        </p>
                    )
                ) : hasContacts ? (
                    <ul className="contacts__grid">
                        {visibleContacts.map((contact) => (
                            <li key={contact.id} className="contacts__item">
                                {renderContactCard(contact)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="contacts__empty">
                        No crew members match that call sign. Try a different search.
                    </p>
                )}

                <nav
                    className="pagination"
                    aria-label="Roster pagination"
                    data-view={viewMode}
                >
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={handlePrev}
                        disabled={!hasContacts || !canGoPrev || !isSingleView}
                    >
                        Previous
                    </button>
                    <p className="pagination__status" aria-live="polite">
                        {paginationMessage}
                    </p>
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={handleNext}
                        disabled={!hasContacts || !canGoNext || !isSingleView}
                    >
                        Next
                    </button>
                </nav>
            </section>

            <section className="form" aria-labelledby="form-heading">
                <h2 id="form-heading">Add a Contact</h2>
                <form className="form__body" onSubmit={handleSubmit} noValidate>
                    <div className={`field${formErrors.name ? " field--error" : ""}`}>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            name="name"
                            placeholder="E.g., Captain Nova Starling"
                            value={form.name}
                            onChange={handleInputChange("name")}
                            required
                            minLength={2}
                            aria-invalid={Boolean(formErrors.name)}
                            aria-describedby={formErrors.name ? "name-error" : undefined}
                            autoComplete="name"
                        />
                        {formErrors.name ? (
                            <p className="field__error" id="name-error" role="alert">
                                {formErrors.name}
                            </p>
                        ) : null}
                    </div>
                    <div className={`field${formErrors.phone ? " field--error" : ""}`}>
                        <label htmlFor="phone">Phone</label>
                        <input
                            id="phone"
                            name="phone"
                            inputMode="tel"
                            placeholder="(555) 555-5555"
                            value={form.phone}
                            onChange={handleInputChange("phone")}
                            required
                            aria-invalid={Boolean(formErrors.phone)}
                            aria-describedby={formErrors.phone ? "phone-error" : undefined}
                            autoComplete="tel"
                        />
                        {formErrors.phone ? (
                            <p className="field__error" id="phone-error" role="alert">
                                {formErrors.phone}
                            </p>
                        ) : null}
                    </div>
                    <div className={`field${formErrors.email ? " field--error" : ""}`}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="E.g., captain@stellarhq.io"
                            value={form.email}
                            onChange={handleInputChange("email")}
                            required
                            aria-invalid={Boolean(formErrors.email)}
                            aria-describedby={formErrors.email ? "email-error" : undefined}
                            autoComplete="email"
                        />
                        {formErrors.email ? (
                            <p className="field__error" id="email-error" role="alert">
                                {formErrors.email}
                            </p>
                        ) : null}
                    </div>
                    <div className="form__actions">
                        <button className="btn" type="submit" data-testid="btn-add">
                            Add Contact
                        </button>
                    </div>
                </form>
            </section>

            <footer className="page__footer">
                <small>
                    Live long and prosper.
                </small>
            </footer>
        </main>
    );
};

export default App;
