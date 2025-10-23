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

const GRID_PAGE_SIZE = 9;
const CONTACTS_API_BASE = "/api/contacts";

async function apiRequest(path, options = {}) {
    const config = { ...options };
    if (config.body && !config.headers?.["Content-Type"]) {
        config.headers = {
            ...(config.headers || {}),
            "Content-Type": "application/json",
        };
    }

    const response = await fetch(path, config);
    let payload = null;
    const text = await response.text();
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (error) {
            console.error("Failed to parse JSON response", error, text);
        }
    }

    if (!response.ok) {
        const message =
            payload?.error || payload?.message || response.statusText || "Request failed";
        throw new Error(message);
    }

    return payload;
}

const contactsApi = {
    async list() {
        const data = await apiRequest(CONTACTS_API_BASE);
        return Array.isArray(data?.contacts) ? data.contacts : [];
    },
    async create(contact) {
        const data = await apiRequest(CONTACTS_API_BASE, {
            method: "POST",
            body: JSON.stringify(contact),
        });
        return data?.contact;
    },
    async update(id, contact) {
        const data = await apiRequest(`${CONTACTS_API_BASE}/${id}`, {
            method: "PUT",
            body: JSON.stringify(contact),
        });
        return data?.contact;
    },
    async remove(id) {
        await apiRequest(`${CONTACTS_API_BASE}/${id}`, { method: "DELETE" });
        return true;
    },
};

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
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isActive = true;

        const fetchContacts = async () => {
            try {
                setLoading(true);
                setError(null);
                const remoteContacts = await contactsApi.list();
                if (!isActive) {
                    return;
                }

                if (Array.isArray(remoteContacts) && remoteContacts.length > 0) {
                    const normalized = remoteContacts.map((contact, index) =>
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
        const total = visibleContacts.length;
        if (total === 0) {
            setCurrentPage(0);
            return;
        }
        const maxIndex =
            viewMode === "single"
                ? total - 1
                : Math.max(Math.ceil(total / GRID_PAGE_SIZE) - 1, 0);
        setCurrentPage((prev) => Math.min(prev, Math.max(maxIndex, 0)));
    }, [visibleContacts, viewMode]);

    useEffect(() => {
        setCurrentPage(0);
    }, [query]);

    const [form, setForm] = useState({ name: "", phone: "", email: "" });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        email: "",
        title: "",
    });
    const [editErrors, setEditErrors] = useState({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editStatus, setEditStatus] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
        setFormStatus(null);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        const validation = validateForm(form);
        setFormErrors(validation);
        if (Object.keys(validation).length > 0) {
            setFormStatus("Please correct the highlighted fields.");
            return;
        }

        const draftContact = normalizeContact({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            title: "Guest Officer",
        });

        setIsSubmitting(true);
        setFormStatus(null);
        try {
            const created = await contactsApi.create(draftContact);
            const normalizedCreated = normalizeContact(created ?? draftContact);
            setContacts((prev) => [
                normalizedCreated,
                ...prev.filter((contact) => contact.id !== normalizedCreated.id),
            ]);
            setForm({ name: "", phone: "", email: "" });
            setFormErrors({});
            setFormStatus("Contact added to roster.");
            setCurrentPage(0);
        } catch (err) {
            console.error("Failed to add contact", err);
            setFormStatus(err.message || "Failed to add contact. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handlePrev = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = (maxPageIndex) => {
        setCurrentPage((prev) => Math.min(prev + 1, maxPageIndex));
    };

    const handleViewToggle = (mode, targetIndex = null) => {
        if (mode !== "single" && mode !== "grid") {
            return;
        }
        if (mode === viewMode && targetIndex === null) {
            setEditingId(null);
            setEditErrors({});
            setEditStatus(null);
            return;
        }
        setCurrentPage((prev) => {
            if (targetIndex !== null) {
                return mode === "single"
                    ? Math.max(0, targetIndex)
                    : Math.max(0, Math.floor(targetIndex / GRID_PAGE_SIZE));
            }
            if (mode === "single" && viewMode === "grid") {
                return prev * GRID_PAGE_SIZE;
            }
            if (mode === "grid" && viewMode === "single") {
                return Math.floor(prev / GRID_PAGE_SIZE);
            }
            return prev;
        });
        if (mode !== viewMode) {
            setViewMode(mode);
        }
        setEditingId(null);
        setEditErrors({});
        setEditStatus(null);
    };

    const handleSelectContact = (contactId) => {
        const index = visibleContacts.findIndex(
            (contact) => String(contact.id) === String(contactId)
        );
        if (index === -1) {
            return;
        }
        handleViewToggle("single", index);
    };

    const handleStartEdit = (contact) => {
        if (!contact) {
            return;
        }
        setEditingId(contact.id);
        setEditForm({
            name: contact.name ?? "",
            phone: contact.phone ?? "",
            email: contact.email ?? "",
            title: contact.title ?? "",
        });
        setEditErrors({});
        setEditStatus(null);
    };

    const handleEditChange = (field) => (event) => {
        const { value } = event.target;
        setEditForm((prev) => ({ ...prev, [field]: value }));
        setEditErrors((prev) => {
            const { [field]: _removed, ...rest } = prev;
            const error = validateField(field, value);
            return error ? { ...rest, [field]: error } : rest;
        });
        setEditStatus(null);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditForm({ name: "", phone: "", email: "", title: "" });
        setEditErrors({});
        setEditStatus(null);
    };

    const handleDelete = async (contact) => {
        if (!contact) {
            return;
        }
        const confirmed =
            typeof window === "undefined"
                ? true
                : window.confirm(
                      `Remove ${contact.name} from the Stellar Fleet roster?`
                  );
        if (!confirmed) {
            return;
        }
        setIsDeleting(true);
        setEditStatus(null);
        try {
            await contactsApi.remove(contact.id);
            setContacts((prev) =>
                prev.filter((existing) => String(existing.id) !== String(contact.id))
            );
            setEditingId(null);
            setEditForm({ name: "", phone: "", email: "", title: "" });
            setEditErrors({});
            setEditStatus(`${contact.name} has been removed from the roster.`);
        } catch (err) {
            console.error("Failed to delete contact", err);
            setEditStatus(err.message || "Failed to delete contact.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditSubmit = async (event, contact) => {
        event.preventDefault();
        if (!contact) {
            return;
        }
        const validation = validateForm(editForm);
        setEditErrors(validation);
        if (Object.keys(validation).length > 0) {
            setEditStatus("Please correct the highlighted fields.");
            return;
        }

        const draft = normalizeContact({
            ...contact,
            ...editForm,
            name: editForm.name.trim(),
            phone: editForm.phone.trim(),
            email: editForm.email.trim(),
            title: editForm.title.trim() || contact.title || "Mission Specialist",
        });

        setIsSavingEdit(true);
        setEditStatus(null);
        try {
            const updated = await contactsApi.update(contact.id, draft);
            const normalizedUpdated = normalizeContact(updated ?? draft);
            setContacts((prev) =>
                prev.map((existing) =>
                    String(existing.id) === String(normalizedUpdated.id)
                        ? normalizedUpdated
                        : existing
                )
            );
            setEditingId(null);
            setEditForm({ name: "", phone: "", email: "", title: "" });
            setEditErrors({});
            setEditStatus("Contact updated.");
        } catch (err) {
            console.error("Failed to update contact", err);
            setEditStatus(err.message || "Failed to update contact.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const renderContactCard = (contact, variant = "grid", options = {}) => {
        const { onSelect } = options;
        const interactive = typeof onSelect === "function";
        const cardClasses = [
            "contact-card",
            `contact-card--${variant}`,
            interactive ? "contact-card--interactive" : "",
        ]
            .filter(Boolean)
            .join(" ");

        const handleCardClick = () => {
            if (interactive) {
                onSelect(contact);
            }
        };

        const handleCardKeyDown = (event) => {
            if (!interactive) {
                return;
            }
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(contact);
            }
        };

        return (
            <article
                className={cardClasses}
                aria-labelledby={`contact-${contact.id}-name`}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                onClick={interactive ? handleCardClick : undefined}
                onKeyDown={interactive ? handleCardKeyDown : undefined}
            >
                <img
                    className={`contact-card__photo contact-card__photo--${variant}`}
                    src={contact.photo}
                    alt={contact.photoAlt}
                    width="150"
                    height="150"
                    loading="lazy"
                />
                <div
                    className={`contact-card__content contact-card__content--${variant}`}
                >
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
    };

    const isSingleView = viewMode === "single";
    const hasContacts = visibleContacts.length > 0;
    const totalPages = hasContacts
        ? isSingleView
            ? visibleContacts.length
            : Math.ceil(visibleContacts.length / GRID_PAGE_SIZE)
        : 0;
    const pageStart = isSingleView ? currentPage : currentPage * GRID_PAGE_SIZE;
    const perPage = isSingleView ? 1 : GRID_PAGE_SIZE;
    const pageEnd = pageStart + perPage;
    const paginatedContacts = visibleContacts.slice(pageStart, pageEnd);
    const currentContact = isSingleView ? paginatedContacts[0] ?? null : null;
    const maxPageIndex = hasContacts ? Math.max(totalPages - 1, 0) : 0;
    const canGoPrev = currentPage > 0;
    const canGoNext = currentPage < maxPageIndex;
    const paginationMessage = hasContacts
        ? isSingleView
            ? `Officer ${currentPage + 1} of ${visibleContacts.length}`
            : `Page ${currentPage + 1} of ${totalPages} • ${visibleContacts.length} officers`
        : loading
          ? "Loading roster..."
          : "No officers to display";

    const currentContactId = currentContact?.id ?? "current";
    const editNameId = `edit-name-${currentContactId}`;
    const editPhoneId = `edit-phone-${currentContactId}`;
    const editEmailId = `edit-email-${currentContactId}`;
    const editTitleId = `edit-title-${currentContactId}`;

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

                {loading ? (
                    <p className="contacts__loading" role="status">
                        Synchronizing roster...
                    </p>
                ) : isSingleView ? (
                    hasContacts && currentContact ? (
                        <div className="contact-profile" data-testid="single-contact">
                            {renderContactCard(currentContact, "single")}
                            {editStatus ? (
                                <p className="status-message" role="status">
                                    {editStatus}
                                </p>
                            ) : null}
                            {editingId === currentContact.id ? (
                                <form
                                    className="contact-editor"
                                    onSubmit={(event) => handleEditSubmit(event, currentContact)}
                                    noValidate
                                >
                                    <div
                                        className={`field${
                                            editErrors.name ? " field--error" : ""
                                        }`}
                                    >
                                        <label htmlFor={editNameId}>Name</label>
                                        <input
                                            id={editNameId}
                                            value={editForm.name}
                                            onChange={handleEditChange("name")}
                                            required
                                            minLength={2}
                                            aria-invalid={Boolean(editErrors.name)}
                                            aria-describedby={
                                                editErrors.name ? `${editNameId}-error` : undefined
                                            }
                                        />
                                        {editErrors.name ? (
                                            <p
                                                className="field__error"
                                                id={`${editNameId}-error`}
                                                role="alert"
                                            >
                                                {editErrors.name}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div
                                        className={`field${
                                            editErrors.phone ? " field--error" : ""
                                        }`}
                                    >
                                        <label htmlFor={editPhoneId}>Phone</label>
                                        <input
                                            id={editPhoneId}
                                            value={editForm.phone}
                                            onChange={handleEditChange("phone")}
                                            inputMode="tel"
                                            required
                                            aria-invalid={Boolean(editErrors.phone)}
                                            aria-describedby={
                                                editErrors.phone
                                                    ? `${editPhoneId}-error`
                                                    : undefined
                                            }
                                        />
                                        {editErrors.phone ? (
                                            <p
                                                className="field__error"
                                                id={`${editPhoneId}-error`}
                                                role="alert"
                                            >
                                                {editErrors.phone}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div
                                        className={`field${
                                            editErrors.email ? " field--error" : ""
                                        }`}
                                    >
                                        <label htmlFor={editEmailId}>Email</label>
                                        <input
                                            id={editEmailId}
                                            value={editForm.email}
                                            onChange={handleEditChange("email")}
                                            type="email"
                                            required
                                            aria-invalid={Boolean(editErrors.email)}
                                            aria-describedby={
                                                editErrors.email
                                                    ? `${editEmailId}-error`
                                                    : undefined
                                            }
                                        />
                                        {editErrors.email ? (
                                            <p
                                                className="field__error"
                                                id={`${editEmailId}-error`}
                                                role="alert"
                                            >
                                                {editErrors.email}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="field">
                                        <label htmlFor={editTitleId}>Title</label>
                                        <input
                                            id={editTitleId}
                                            value={editForm.title}
                                            onChange={handleEditChange("title")}
                                            placeholder="E.g., Chief Navigator"
                                        />
                                    </div>
                                    <div className="contact-editor__actions">
                                        <button
                                            type="submit"
                                            className="btn"
                                            disabled={isSavingEdit}
                                        >
                                            {isSavingEdit ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn--ghost"
                                            onClick={handleEditCancel}
                                            disabled={isSavingEdit}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="contact-actions">
                                    <button
                                        type="button"
                                        className="btn btn--ghost"
                                        onClick={() => handleStartEdit(currentContact)}
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn--danger"
                                        onClick={() => handleDelete(currentContact)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="contacts__empty">
                            No crew members match that call sign. Try a different search.
                        </p>
                    )
                ) : hasContacts ? (
                    <ul className="contacts__grid">
                        {paginatedContacts.map((contact) => (
                            <li key={contact.id} className="contacts__item">
                                {renderContactCard(contact, "grid", {
                                    onSelect: () => handleSelectContact(contact.id),
                                })}
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
                        disabled={!hasContacts || !canGoPrev}
                    >
                        Previous
                    </button>
                    <p className="pagination__status" aria-live="polite">
                        {paginationMessage}
                    </p>
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => handleNext(maxPageIndex)}
                        disabled={!hasContacts || !canGoNext}
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
                        <button
                            className="btn"
                            type="submit"
                            data-testid="btn-add"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Adding..." : "Add Contact"}
                        </button>
                    </div>
                    {formStatus ? (
                        <p className="status-message form__status" role="status">
                            {formStatus}
                        </p>
                    ) : null}
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
