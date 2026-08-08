import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed script.");
}

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const SEED_DOMAIN = "@seed.archicareer.dev";
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;
const DICEBEAR_AVATAAARS_BASE_URL = "https://api.dicebear.com/9.x/avataaars/svg";
const DICEBEAR_INITIALS_BASE_URL = "https://api.dicebear.com/9.x/initials/svg";

function avatarUrlForSeed(seed) {
    const params = new URLSearchParams({
        seed,
        backgroundColor: "f4d35e,ee964b,f95738,8bd3dd,b8e986,cdb4db",
        skinColor: "614335,ae5d29,d08b5b,edb98a,ffdbb4",
        hairColor: "2c1b18,4a312c,724133,a55728,b58143,d6b370",
        facialHairColor: "2c1b18,4a312c,724133,a55728,b58143",
        clothesColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
        hatColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
        accessoriesColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
        borderRadius: "50",
    });

    return `${DICEBEAR_AVATAAARS_BASE_URL}?${params.toString()}`;
}

function firmLogoUrlForSeed(seed) {
    const params = new URLSearchParams({
        seed,
        backgroundColor: "005f73,0a9396,9b2226,ca6702,3a86ff,8338ec",
        textColor: "ffffff",
        fontSize: "34",
        fontWeight: "700",
        radius: "18",
    });

    return `${DICEBEAR_INITIALS_BASE_URL}?${params.toString()}`;
}

if (!DEFAULT_PASSWORD || DEFAULT_PASSWORD.length < 12) {
    throw new Error("Set SEED_DEFAULT_PASSWORD to a unique password of at least 12 characters before running the seed script.");
}

const seedUsers = [
    {
        key: "amina-bello",
        email: `amina.bello${SEED_DOMAIN}`,
        name: "Amina Bello",
        role: "student",
        school_or_firm: "University of Lagos",
        bio: "Architecture student focused on climate-responsive housing, model making, and urban research in Lagos.",
        location: "Yaba, Lagos",
        software_proficiency: ["Revit", "Rhino", "Adobe InDesign", "QGIS"],
        personal_site_url: "https://amina-bello.example",
        linkedin_url: "https://linkedin.com/in/amina-bello",
        instagram_url: "https://instagram.com/amina.bello.arch",
        social_links: {
            portfolio: "https://amina-bello.example",
            instagram: "https://instagram.com/amina.bello.arch",
        },
    },
    {
        key: "sani-musa",
        email: `sani.musa${SEED_DOMAIN}`,
        name: "Sani Musa",
        role: "student",
        school_or_firm: "Ahmadu Bello University",
        bio: "Final-year designer interested in how low-tech fabrication, clear drawings, and repeatable housing systems can make good architecture easier to deliver.",
        location: "Zaria, Kaduna",
        software_proficiency: ["AutoCAD", "SketchUp", "V-Ray", "Adobe Photoshop"],
        personal_site_url: "https://sani-musa.example",
        linkedin_url: "https://linkedin.com/in/sani-musa",
        social_links: {
            portfolio: "https://sani-musa.example",
            linkedin: "https://linkedin.com/in/sani-musa",
        },
    },
    {
        key: "zainab-aliyu",
        email: `zainab.aliyu${SEED_DOMAIN}`,
        name: "Zainab Aliyu",
        role: "student",
        school_or_firm: "Federal University of Technology, Akure",
        bio: "Architecture student combining landscape research, environmental mapping, and computational workflows to study how public space can manage heat and heavy rain.",
        location: "Akure, Ondo",
        software_proficiency: ["Rhino", "Grasshopper", "Lumion", "QGIS", "Adobe Illustrator"],
        personal_site_url: "https://zainab-aliyu.example",
        linkedin_url: "https://linkedin.com/in/zainab-aliyu",
        social_links: {
            portfolio: "https://zainab-aliyu.example",
            linkedin: "https://linkedin.com/in/zainab-aliyu",
        },
    },
    {
        key: "tunde-akinyemi",
        email: `tunde.akinyemi${SEED_DOMAIN}`,
        name: "Tunde Akinyemi",
        role: "architect",
        school_or_firm: "Maki & Partners",
        bio: "Architect working between concept design and the realities of delivery: tight urban sites, consultant coordination, procurement decisions, and details that survive construction.",
        location: "Ikeja, Lagos",
        software_proficiency: ["Revit", "AutoCAD", "Enscape", "Bluebeam", "Adobe InDesign"],
        personal_site_url: "https://tunde-akinyemi.example",
        linkedin_url: "https://linkedin.com/in/tunde-akinyemi",
        social_links: {
            linkedin: "https://linkedin.com/in/tunde-akinyemi",
            website: "https://tunde-akinyemi.example",
        },
    },
    {
        key: "ifeoma-okafor",
        email: `ifeoma.okafor${SEED_DOMAIN}`,
        name: "Ifeoma Okafor",
        role: "architect",
        school_or_firm: "Atelier Atlas",
        bio: "Architect and interior designer drawn to public work with a human scale: adaptive reuse, civic interiors, and spaces that make people feel oriented, welcome, and considered.",
        location: "Wuse II, Abuja",
        software_proficiency: ["Revit", "Rhino", "Enscape", "Adobe InDesign", "Miro"],
        personal_site_url: "https://ifeoma-okafor.example",
        linkedin_url: "https://linkedin.com/in/ifeoma-okafor",
        social_links: {
            linkedin: "https://linkedin.com/in/ifeoma-okafor",
            website: "https://ifeoma-okafor.example",
        },
    },
    {
        key: "kora-urban-practice",
        email: `kora.urban.practice${SEED_DOMAIN}`,
        name: "Kora Urban Practice",
        role: "firm",
        school_or_firm: "Lagos, Nigeria",
        bio: "A compact design and delivery practice working across Lagos housing and mixed-use projects. The studio is interested in generous thresholds, passive comfort, and details that remain legible from drawing to site.",
        location: "Lekki, Lagos",
        software_proficiency: ["Revit", "Rhino", "Enscape", "AutoCAD", "Notion"],
        personal_site_url: "https://koraurbanpractice.example",
        linkedin_url: "https://linkedin.com/company/kora-urban-practice",
        social_links: {
            website: "https://koraurbanpractice.example",
            linkedin: "https://linkedin.com/company/kora-urban-practice",
        },
    },
    {
        key: "northstar-atelier",
        email: `northstar.atelier${SEED_DOMAIN}`,
        name: "Northstar Atelier",
        role: "firm",
        school_or_firm: "Abuja, Nigeria",
        bio: "A design-led Abuja office for civic, workplace, and institutional architecture. Northstar brings research, technical coordination, and a calm visual language to complex public programmes.",
        location: "Central District, Abuja",
        software_proficiency: ["Revit", "BIM 360", "Rhino", "Enscape", "Adobe InDesign"],
        personal_site_url: "https://northstaratelier.example",
        linkedin_url: "https://linkedin.com/company/northstar-atelier",
        social_links: {
            website: "https://northstaratelier.example",
            linkedin: "https://linkedin.com/company/northstar-atelier",
        },
    },
    {
        key: "bala-co-studio",
        email: `bala.co.studio${SEED_DOMAIN}`,
        name: "Bala & Co. Studio",
        role: "firm",
        school_or_firm: "Enugu, Nigeria",
        bio: "An Enugu-based studio working across learning spaces, small cultural commissions, and homes. Bala & Co. uses careful proportion, durable materials, and strong graphic communication to make modest briefs feel substantial.",
        location: "Enugu",
        software_proficiency: ["ArchiCAD", "SketchUp", "Twinmotion", "Adobe Photoshop", "AutoCAD"],
        personal_site_url: "https://balacostudio.example",
        linkedin_url: "https://linkedin.com/company/bala-and-co-studio",
        social_links: {
            website: "https://balacostudio.example",
            linkedin: "https://linkedin.com/company/bala-and-co-studio",
        },
    },
];

const generatedFirstNames = [
    "Ada", "Adanna", "Adeola", "Aisha", "Amaka", "Babatunde", "Bassey", "Chiamaka", "Chidi", "Chinonso",
    "Damilola", "David", "Efe", "Eniola", "Esther", "Faruq", "Fatima", "Femi", "Hauwa", "Ibrahim",
    "Ikenna", "Imani", "Jide", "Kelechi", "Lara", "Mariam", "Maya", "Mfon", "Nadia", "Nneka",
    "Obinna", "Ogechi", "Olamide", "Opeyemi", "Osas", "Rasheed", "Sade", "Samuel", "Tari", "Yusuf",
];

const generatedLastNames = [
    "Abubakar", "Adebayo", "Ademola", "Afolabi", "Agbaje", "Agu", "Ajayi", "Akpan", "Alabi", "Ali",
    "Balogun", "Bamidele", "Bassey", "Danladi", "Eze", "Ibrahim", "Iheanacho", "Lawal", "Madu", "Makanjuola",
    "Mohammed", "Nwosu", "Ojo", "Okeke", "Okoro", "Oladele", "Olawale", "Onyema", "Salami", "Suleiman",
    "Taiwo", "Udo", "Umeh", "Yakubu", "Yusuf",
];

const generatedLocations = [
    ["Lagos Island", "Lagos"], ["Surulere", "Lagos"], ["Yaba", "Lagos"], ["Ikeja", "Lagos"],
    ["Wuse", "Abuja"], ["Gwarinpa", "Abuja"], ["Kaduna North", "Kaduna"], ["Zaria", "Kaduna"],
    ["Kano Municipal", "Kano"], ["Ibadan", "Oyo"], ["Ile-Ife", "Osun"], ["Akure", "Ondo"],
    ["Benin City", "Edo"], ["Enugu", "Enugu"], ["Nsukka", "Enugu"], ["Port Harcourt", "Rivers"],
    ["Uyo", "Akwa Ibom"], ["Calabar", "Cross River"], ["Owerri", "Imo"], ["Ilorin", "Kwara"],
    ["Jos", "Plateau"], ["Minna", "Niger"], ["Abeokuta", "Ogun"], ["Asaba", "Delta"],
];

const generatedSchools = [
    "University of Lagos", "Ahmadu Bello University", "University of Nigeria, Nsukka", "Obafemi Awolowo University",
    "University of Ibadan", "Federal University of Technology, Akure", "University of Jos", "Rivers State University",
    "Covenant University", "Nile University of Nigeria", "Baze University", "Enugu State University of Science and Technology",
];

const generatedFocuses = [
    ["passive cooling", "housing prototypes", "clear technical drawings"],
    ["community-led planning", "public space", "inclusive neighbourhoods"],
    ["material research", "low-carbon construction", "local fabrication"],
    ["digital modelling", "parametric studies", "data-informed design"],
    ["adaptive reuse", "interior atmospheres", "careful detailing"],
    ["landscape systems", "water management", "urban heat resilience"],
    ["civic architecture", "wayfinding", "welcoming public buildings"],
    ["housing delivery", "consultant coordination", "buildable details"],
];

const generatedSoftwareSets = [
    ["AutoCAD", "Revit", "Adobe InDesign"],
    ["Rhino", "Grasshopper", "Adobe Illustrator", "QGIS"],
    ["SketchUp", "V-Ray", "Adobe Photoshop"],
    ["ArchiCAD", "Twinmotion", "Adobe Photoshop", "AutoCAD"],
    ["Revit", "Enscape", "Bluebeam", "Microsoft Office"],
    ["Blender", "Rhino", "Grasshopper", "D5 Render"],
    ["QGIS", "ArcGIS", "Illustrator", "InDesign"],
];

function generatedPortfolioFor(spec, index, focus) {
    const projectTypes = ["residential", "urban", "institutional", "interior", "landscape", "commercial"];
    const type = projectTypes[index % projectTypes.length];
    const place = generatedLocations[index % generatedLocations.length][0];
    return [
        {
            title: `${place} ${type === "urban" ? "Street Study" : "Design Study"}`,
            description: `A ${focus[0]} project exploring ${focus[1]} through drawings, models, and a practical material strategy.`,
            category: type,
            imageSeed: `${spec.key}-${type}-one`,
        },
        {
            title: `${focus[2].replace(/\b\w/g, (character) => character.toUpperCase())} ${type === "landscape" ? "Landscape Framework" : "Studio Project"}`,
            description: `A portfolio piece about ${focus[2]}, with attention to context, human experience, and how the proposal could be delivered.`,
            category: type === "commercial" ? "institutional" : type,
            imageSeed: `${spec.key}-${type}-two`,
        },
    ];
}

function generateSeedUsers(targetCount) {
    const existingNames = new Set(seedUsers.map((spec) => spec.name));
    const generated = [];
    let candidateIndex = 0;

    while (generated.length < targetCount) {
        const first = generatedFirstNames[candidateIndex % generatedFirstNames.length];
        const last = generatedLastNames[Math.floor(candidateIndex / generatedFirstNames.length) % generatedLastNames.length];
        const name = `${first} ${last}`;
        candidateIndex += 1;

        if (existingNames.has(name)) continue;
        existingNames.add(name);

        const location = generatedLocations[generated.length % generatedLocations.length];
        const focus = generatedFocuses[generated.length % generatedFocuses.length];
        const isStudent = generated.length < 180;
        const isFirm = generated.length >= 280;
        const role = isFirm ? "firm" : isStudent ? "student" : "architect";
        const slug = slugify(name);
        const schoolOrFirm = isStudent
            ? `${generatedSchools[generated.length % generatedSchools.length]}${generated.length % 3 === 0 ? " — Architecture" : ""}`
            : isFirm
                ? `${location[0]}, ${location[1]}`
                : `${["Harbourline Studio", "Civic Thread Architects", "Groundwork Partners", "Mosaic Design Office"][generated.length % 4]}`;
        const bio = isStudent
            ? `${name} is an architecture student interested in ${focus[0]}, ${focus[1]}, and thoughtful design communication. Their work moves between research, making, and proposals grounded in everyday Nigerian contexts.`
            : isFirm
                ? `${name} is a design practice based in ${location[0]}, working across ${focus[0]}, ${focus[1]}, and carefully resolved projects that connect strong ideas to the realities of delivery.`
                : `${name} is an architect working across ${focus[0]}, ${focus[1]}, and ${focus[2]}. They enjoy translating early concepts into coordinated drawings, useful conversations, and details that can stand up on site.`;
        const spec = {
            key: slug,
            email: `${slug}${SEED_DOMAIN}`,
            name,
            role,
            school_or_firm: schoolOrFirm,
            bio,
            location: `${location[0]}, ${location[1]}`,
            software_proficiency: generatedSoftwareSets[generated.length % generatedSoftwareSets.length],
            personal_site_url: `https://${slug}.example`,
            linkedin_url: `https://linkedin.com/in/${slug}`,
            instagram_url: `https://instagram.com/${slug}.studio`,
            social_links: {
                portfolio: `https://${slug}.example`,
                linkedin: `https://linkedin.com/in/${slug}`,
            },
        };
        spec.portfolioItems = generatedPortfolioFor(spec, generated.length, focus);
        generated.push(spec);
    }

    return generated;
}

seedUsers.push(...generateSeedUsers(292));

const seedFirmsData = [
    {
        name: "Kora Urban Practice",
        slug: "kora-urban-practice",
        logo_url: firmLogoUrlForSeed("Kora Urban Practice"),
        verified: true,
    },
    {
        name: "Northstar Atelier",
        slug: "northstar-atelier",
        logo_url: firmLogoUrlForSeed("Northstar Atelier"),
        verified: true,
    },
    {
        name: "Bala & Co. Studio",
        slug: "bala-co-studio",
        logo_url: firmLogoUrlForSeed("Bala and Co Studio"),
        verified: false,
    },
    {
        name: "Axiom Terrain",
        slug: "axiom-terrain",
        logo_url: firmLogoUrlForSeed("Axiom Terrain"),
        verified: false,
    },
    {
        name: "Studio Lekki North",
        slug: "studio-lekki-north",
        logo_url: firmLogoUrlForSeed("Studio Lekki North"),
        verified: true,
    },
];

const portfolioByEmail = {
    [`amina.bello${SEED_DOMAIN}`]: [
        {
            title: "Courtyard Housing Study",
            description: "A compact housing prototype tuned for shade, cross ventilation, and shared outdoor thresholds.",
            category: "residential",
            imageSeed: "amina-courtyard-housing",
        },
        {
            title: "Lagos Transit Hub Redesign",
            description: "Wayfinding and circulation studies for a busy multimodal transport interchange.",
            category: "urban",
            imageSeed: "amina-transit-hub",
        },
        {
            title: "Library Commons Sections",
            description: "Sectional drawings exploring light wells, quiet rooms, and a flexible reading hall.",
            category: "academic",
            imageSeed: "amina-library-commons",
        },
    ],
    [`sani.musa${SEED_DOMAIN}`]: [
        {
            title: "Workshop Courtyard Models",
            description: "Fabrication-heavy massing and joinery experiments developed during studio reviews.",
            category: "other",
            imageSeed: "sani-workshop-courtyard",
        },
        {
            title: "Student Housing Envelope",
            description: "A low-cost facade strategy with screens, fins, and walkable shaded galleries.",
            category: "residential",
            imageSeed: "sani-student-housing",
        },
        {
            title: "Community Library Axonometry",
            description: "An axonometric set focused on modular structure and a calm public interior.",
            category: "academic",
            imageSeed: "sani-community-library",
        },
    ],
    [`zainab.aliyu${SEED_DOMAIN}`]: [
        {
            title: "Campus Landscape Sections",
            description: "Landscape studies that pair drainage, planting, and pedestrian comfort across a campus spine.",
            category: "landscape",
            imageSeed: "zainab-campus-landscape",
        },
        {
            title: "Climate Research Pavilion",
            description: "A light steel pavilion exploring daylight, ventilation, and passive cooling strategies.",
            category: "institutional",
            imageSeed: "zainab-research-pavilion",
        },
        {
            title: "Urban Fabric Mapping",
            description: "Neighbourhood mapping graphics that translate site observations into a clear design narrative.",
            category: "urban",
            imageSeed: "zainab-urban-fabric",
        },
    ],
    [`tunde.akinyemi${SEED_DOMAIN}`]: [
        {
            title: "Victoria Island Infill",
            description: "A mixed-use infill block designed to fit a tight Lagos parcel with controlled service access.",
            category: "commercial",
            imageSeed: "tunde-victoria-island-infill",
        },
        {
            title: "Facade Retrofit for a Family Compound",
            description: "Material and shading upgrades for an older residential compound without major demolition.",
            category: "residential",
            imageSeed: "tunde-facade-retrofit",
        },
        {
            title: "Coastal Office Lobby",
            description: "A polished reception interior using timber, stone, and long sightlines to the street.",
            category: "interior",
            imageSeed: "tunde-coastal-office-lobby",
        },
    ],
    [`ifeoma.okafor${SEED_DOMAIN}`]: [
        {
            title: "Civic Hall Interior",
            description: "Public-facing interiors for a civic hall with a restrained palette and acoustic clarity.",
            category: "institutional",
            imageSeed: "ifeoma-civic-hall-interior",
        },
        {
            title: "Adaptive Reuse Block",
            description: "A pragmatic conversion study for an underused office building in central Abuja.",
            category: "commercial",
            imageSeed: "ifeoma-adaptive-reuse",
        },
        {
            title: "Courtyard Office Garden",
            description: "A planted working courtyard designed to break down the scale of a dense workplace floor plate.",
            category: "interior",
            imageSeed: "ifeoma-courtyard-office",
        },
    ],
    [`kora.urban.practice${SEED_DOMAIN}`]: [
        {
            title: "Lekki Courtyard Villas",
            description: "A compact villa cluster with shaded verandas, screened stair cores, and planted edges.",
            category: "residential",
            imageSeed: "kora-lekki-courtyard-villas",
        },
        {
            title: "Mixed-Use Street Section",
            description: "A commercial street frontage study with active ground-floor edges and deep overhangs.",
            category: "urban",
            imageSeed: "kora-mixed-use-street-section",
        },
        {
            title: "Material Board for Coastal Housing",
            description: "A concise material palette for a cost-conscious coastal residential commission.",
            category: "other",
            imageSeed: "kora-material-board",
        },
    ],
    [`northstar.atelier${SEED_DOMAIN}`]: [
        {
            title: "Federal Workplace Lobby",
            description: "A crisp lobby composition balancing security, flow, and daylight in a civic office tower.",
            category: "commercial",
            imageSeed: "northstar-federal-workplace-lobby",
        },
        {
            title: "Conference Centre Section",
            description: "A section-heavy presentation set for a public conference centre and exhibition hall.",
            category: "institutional",
            imageSeed: "northstar-conference-centre",
        },
        {
            title: "Shaded Plaza Study",
            description: "An exterior study of public shade, seating, and hardscape in a hot urban climate.",
            category: "urban",
            imageSeed: "northstar-shaded-plaza",
        },
    ],
    [`bala.co.studio${SEED_DOMAIN}`]: [
        {
            title: "Enugu Learning Centre",
            description: "A learning hub concept anchored by a sheltered courtyard and durable construction details.",
            category: "institutional",
            imageSeed: "bala-enugu-learning-centre",
        },
        {
            title: "Gallery Wall Studies",
            description: "A sequence of display walls and circulation moments for a small exhibition commission.",
            category: "interior",
            imageSeed: "bala-gallery-wall-studies",
        },
        {
            title: "Residential Street Corner",
            description: "A corner house scheme that stacks privacy, shade, and a small front garden.",
            category: "residential",
            imageSeed: "bala-residential-street-corner",
        },
    ],
};

const seedJobsData = [
    {
        posterEmail: `kora.urban.practice${SEED_DOMAIN}`,
        firm_name: "Kora Urban Practice",
        title: "Graduate Architect",
        type: "job",
        description: "Join a Lagos team working on mid-rise residential and mixed-use projects with strong coordination demands.",
        apply_link_or_email: "careers@koraurbanpractice.example",
        status: "open",
    },
    {
        posterEmail: `kora.urban.practice${SEED_DOMAIN}`,
        firm_name: "Kora Urban Practice",
        title: "Summer Design Intern",
        type: "internship",
        description: "Support concept studies, plotting packages, and presentation boards for active client work.",
        apply_link_or_email: "https://koraurbanpractice.example/careers",
        status: "open",
    },
    {
        posterEmail: `kora.urban.practice${SEED_DOMAIN}`,
        firm_name: "Kora Urban Practice",
        title: "Urban Housing Competition Lead",
        type: "competition",
        description: "Coordinate a small competition entry focused on adaptable low-rise housing and street activation.",
        apply_link_or_email: "competitions@koraurbanpractice.example",
        status: "closed",
    },
    {
        posterEmail: `kora.urban.practice${SEED_DOMAIN}`,
        firm_name: "Kora Urban Practice",
        title: "Project Architect",
        type: "job",
        description: "A delivery-heavy role for someone comfortable leading consultants and resolving site issues quickly.",
        apply_link_or_email: "https://koraurbanpractice.example/apply/project-architect",
        status: "open",
    },
    {
        posterEmail: `northstar.atelier${SEED_DOMAIN}`,
        firm_name: "Northstar Atelier",
        title: "BIM Technician",
        type: "job",
        description: "Help a technical team maintain coordinated models, sheets, and issue logs for civic projects.",
        apply_link_or_email: "jobs@northstaratelier.example",
        status: "open",
    },
    {
        posterEmail: `northstar.atelier${SEED_DOMAIN}`,
        firm_name: "Northstar Atelier",
        title: "Architecture Internship",
        type: "internship",
        description: "A six-month placement with exposure to workplace design, documentation, and client presentations.",
        apply_link_or_email: "https://northstaratelier.example/internships",
        status: "open",
    },
    {
        posterEmail: `northstar.atelier${SEED_DOMAIN}`,
        firm_name: "Northstar Atelier",
        title: "Public Library Competition",
        type: "competition",
        description: "Research-led design challenge for a compact public library and community reading room.",
        apply_link_or_email: "competitions@northstaratelier.example",
        status: "open",
    },
    {
        posterEmail: `northstar.atelier${SEED_DOMAIN}`,
        firm_name: "Northstar Atelier",
        title: "Senior Design Coordinator",
        type: "job",
        description: "Lead workflow between design, documentation, and consultants on a civic programme portfolio.",
        apply_link_or_email: "https://northstaratelier.example/careers/senior-design-coordinator",
        status: "closed",
    },
    {
        posterEmail: `bala.co.studio${SEED_DOMAIN}`,
        firm_name: "Bala & Co. Studio",
        title: "Design Architect",
        type: "job",
        description: "Work on cultural, institutional, and residential commissions with a compact Enugu practice.",
        apply_link_or_email: "hello@balacostudio.example",
        status: "open",
    },
    {
        posterEmail: `bala.co.studio${SEED_DOMAIN}`,
        firm_name: "Bala & Co. Studio",
        title: "Research Intern",
        type: "internship",
        description: "Support precedent studies, graphics, and early-stage layouts across active projects.",
        apply_link_or_email: "https://balacostudio.example/internship",
        status: "open",
    },
    {
        posterEmail: `bala.co.studio${SEED_DOMAIN}`,
        firm_name: "Bala & Co. Studio",
        title: "Exhibition Pavilion Competition",
        type: "competition",
        description: "Concept design for a temporary pavilion tied to a regional architecture festival.",
        apply_link_or_email: "competitions@balacostudio.example",
        status: "open",
    },
    {
        posterEmail: `bala.co.studio${SEED_DOMAIN}`,
        firm_name: "Bala & Co. Studio",
        title: "Project Lead, Institutional Work",
        type: "job",
        description: "Coordinate small institutional commissions, site visits, and consultant communication.",
        apply_link_or_email: "https://balacostudio.example/careers/project-lead",
        status: "closed",
    },
];

const seedBookmarksData = [
    {
        bookmarkerEmail: `amina.bello${SEED_DOMAIN}`,
        jobTitle: "Graduate Architect",
    },
    {
        bookmarkerEmail: `amina.bello${SEED_DOMAIN}`,
        jobTitle: "Architecture Internship",
    },
    {
        bookmarkerEmail: `sani.musa${SEED_DOMAIN}`,
        jobTitle: "Research Intern",
    },
    {
        bookmarkerEmail: `sani.musa${SEED_DOMAIN}`,
        jobTitle: "Public Library Competition",
    },
    {
        bookmarkerEmail: `zainab.aliyu${SEED_DOMAIN}`,
        jobTitle: "Urban Housing Competition Lead",
    },
    {
        bookmarkerEmail: `zainab.aliyu${SEED_DOMAIN}`,
        jobTitle: "BIM Technician",
    },
];

function slugify(value) {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "user";
}

async function listAllUsers() {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
        throw new Error(`Unable to list auth users: ${error.message}`);
    }
    return data.users;
}

async function mapWithConcurrency(items, worker, concurrency = 12) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function consume() {
        while (true) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= items.length) return;
            results[index] = await worker(items[index], index);
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => consume()));
    return results;
}

async function withRetry(operation, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 500));
            }
        }
    }
    throw lastError;
}

async function findOrCreateAuthUser(spec, usersCache) {
    let user = usersCache.find((entry) => entry.email === spec.email) ?? null;

    if (user) {
        const { error } = await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
                full_name: spec.name,
                name: spec.name,
                role: spec.role,
                school_or_firm: spec.school_or_firm,
                bio: spec.bio,
                location: spec.location,
                social_links: spec.social_links,
            },
            email_confirm: true,
        });

        if (error) {
            throw new Error(`Unable to update auth user ${spec.email}: ${error.message}`);
        }

        return user;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
            full_name: spec.name,
            name: spec.name,
            role: spec.role,
            school_or_firm: spec.school_or_firm,
            bio: spec.bio,
            location: spec.location,
            social_links: spec.social_links,
        },
    });

    if (error || !data.user) {
        throw new Error(`Unable to create auth user ${spec.email}: ${error?.message ?? "unknown error"}`);
    }

    usersCache.push(data.user);
    return data.user;
}

async function resolveProfileSlug(name, userId) {
    const baseSlug = slugify(name);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
        const { data, error } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("slug", candidate)
            .maybeSingle();

        if (error) {
            throw new Error(`Unable to check profile slug ${candidate}: ${error.message}`);
        }

        if (!data || data.user_id === userId) {
            return candidate;
        }

        candidate = `${baseSlug}-${counter}`;
        counter += 1;
    }
}

async function ensureProfile(user, spec) {
    const { data: existing, error } = await supabase
        .from("profiles")
        .select("id, user_id, slug")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error(`Unable to read profile for ${spec.email}: ${error.message}`);
    }

    const slug = existing?.slug ?? await resolveProfileSlug(spec.name, user.id);
    const profilePayload = {
        user_id: user.id,
        name: spec.name,
        slug,
        role: spec.role,
        school_or_firm: spec.school_or_firm,
        bio: spec.bio,
        location: spec.location,
        social_links: spec.social_links,
        software_proficiency: spec.software_proficiency ?? [],
        cv_url: spec.cv_url ?? null,
        instagram_url: spec.instagram_url ?? null,
        personal_site_url: spec.personal_site_url ?? null,
        linkedin_url: spec.linkedin_url ?? null,
        avatar_url: avatarUrlForSeed(slug),
    };

    if (existing) {
        const { error: updateError } = await supabase
            .from("profiles")
            .update(profilePayload)
            .eq("user_id", user.id);

        if (updateError) {
            throw new Error(`Unable to update profile for ${spec.email}: ${updateError.message}`);
        }

        return { id: existing.id, slug };
    }

    const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert(profilePayload)
        .select("id, slug")
        .single();

    if (insertError || !inserted) {
        throw new Error(`Unable to create profile for ${spec.email}: ${insertError?.message ?? "unknown error"}`);
    }

    return inserted;
}

async function clearSeedPortfolio(profileIds) {
    if (profileIds.length === 0) return;
    const { error } = await supabase.from("portfolio_items").delete().in("profile_id", profileIds);
    if (error) {
        throw new Error(`Unable to clear seed portfolio items: ${error.message}`);
    }
}

async function clearSeedJobs(posterIds) {
    if (posterIds.length === 0) return;
    const { error } = await supabase.from("job_listings").delete().in("user_id", posterIds);
    if (error) {
        throw new Error(`Unable to clear seed job listings: ${error.message}`);
    }
}

async function clearSeedBookmarks(userIds) {
    if (userIds.length === 0) return;
    const { error } = await supabase.from("bookmarks").delete().in("user_id", userIds);
    if (error) {
        throw new Error(`Unable to clear seed bookmarks: ${error.message}`);
    }
}

async function clearSeedFirms(firmNames) {
    const { data, error } = await supabase.from("firms").select("id, name").in("name", firmNames);
    if (error) {
        throw new Error(`Unable to look up seeded firms: ${error.message}`);
    }

    if (!data || data.length === 0) return;

    const { error: deleteError } = await supabase.from("firms").delete().in("id", data.map((firm) => firm.id));
    if (deleteError) {
        throw new Error(`Unable to clear seeded firms: ${deleteError.message}`);
    }
}

async function seedPortfolioItems(profileIndexByEmail) {
    const itemsByEmail = new Map(Object.entries(portfolioByEmail));
    for (const spec of seedUsers) {
        if (spec.portfolioItems) itemsByEmail.set(spec.email, spec.portfolioItems);
    }

    const rows = [];
    const imageSeedByKey = new Map();
    for (const [email, items] of itemsByEmail.entries()) {
        const profile = profileIndexByEmail.get(email);
        if (!profile) {
            throw new Error(`Missing profile for ${email}`);
        }

        for (const [index, item] of items.entries()) {
            rows.push({
                profile_id: profile.id,
                title: item.title,
                description: item.description,
                category: item.category,
                display_order: index,
            });
            imageSeedByKey.set(`${profile.id}:${index}`, item.imageSeed);
        }
    }

    const { data: inserted, error } = await supabase
        .from("portfolio_items")
        .insert(rows)
        .select("id, profile_id, display_order");
    if (error || !inserted) {
        throw new Error(`Unable to seed portfolio items: ${error?.message ?? "no rows returned"}`);
    }

    const imageRows = inserted.map((item) => ({
        portfolio_item_id: item.id,
        image_url: `https://picsum.photos/seed/${imageSeedByKey.get(`${item.profile_id}:${item.display_order}`)}/1200/900`,
        display_order: 0,
    }));
    const { error: imageError } = await supabase.from("portfolio_item_images").insert(imageRows);
    if (imageError) {
        throw new Error(`Unable to seed portfolio images: ${imageError.message}`);
    }
}

async function insertSeedJobs(userIndexByEmail) {
    const rows = seedJobsData.map((job) => {
        const user = userIndexByEmail.get(job.posterEmail);
        if (!user) {
            throw new Error(`Missing job poster for ${job.posterEmail}`);
        }

        return {
            user_id: user.id,
            firm_name: job.firm_name,
            title: job.title,
            type: job.type,
            description: job.description,
            apply_link_or_email: job.apply_link_or_email,
            status: job.status,
        };
    });

    const { error } = await supabase.from("job_listings").insert(rows);
    if (error) {
        throw new Error(`Unable to seed job listings: ${error.message}`);
    }
}

async function insertSeedBookmarks(userIndexByEmail, jobIndexByTitle) {
    const rows = seedBookmarksData.map((bookmark) => {
        const user = userIndexByEmail.get(bookmark.bookmarkerEmail);
        const job = jobIndexByTitle.get(bookmark.jobTitle);

        if (!user) {
            throw new Error(`Missing bookmark user for ${bookmark.bookmarkerEmail}`);
        }

        if (!job) {
            throw new Error(`Missing bookmarked job ${bookmark.jobTitle}`);
        }

        return {
            user_id: user.id,
            job_listing_id: job.id,
        };
    });

    const { error } = await supabase.from("bookmarks").insert(rows);
    if (error) {
        throw new Error(`Unable to seed bookmarks: ${error.message}`);
    }
}

async function insertSeedFirms() {
    const rows = seedFirmsData.map((firm) => ({
        name: firm.name,
        slug: firm.slug,
        logo_url: firm.logo_url,
        verified: firm.verified,
    }));

    const { error } = await supabase.from("firms").insert(rows);
    if (error) {
        throw new Error(`Unable to seed firms: ${error.message}`);
    }
}

async function main() {
    console.log("Loading seed users...");
    const usersCache = await listAllUsers();

    const authUsersByEmail = new Map();
    const authUsers = await mapWithConcurrency(seedUsers, async (spec) => {
        const user = await withRetry(() => findOrCreateAuthUser(spec, usersCache));
        return [spec.email, user];
    }, 4);
    for (const [email, user] of authUsers) authUsersByEmail.set(email, user);

    const profilesByEmail = new Map();
    const profiles = await mapWithConcurrency(seedUsers, async (spec) => {
        const user = authUsersByEmail.get(spec.email);
        const profile = await withRetry(() => ensureProfile(user, spec));
        return [spec.email, profile];
    }, 4);
    for (const [email, profile] of profiles) profilesByEmail.set(email, profile);

    const seedProfileIds = [...profilesByEmail.values()].map((profile) => profile.id);
    const seedUserIds = [...authUsersByEmail.values()].map((user) => user.id);
    const seedPosterIds = [
        authUsersByEmail.get(`kora.urban.practice${SEED_DOMAIN}`)?.id,
        authUsersByEmail.get(`northstar.atelier${SEED_DOMAIN}`)?.id,
        authUsersByEmail.get(`bala.co.studio${SEED_DOMAIN}`)?.id,
    ].filter(Boolean);

    console.log("Clearing previous seeded rows...");
    await clearSeedPortfolio(seedProfileIds);
    await clearSeedJobs(seedPosterIds);
    await clearSeedBookmarks(seedUserIds);
    await clearSeedFirms(seedFirmsData.map((firm) => firm.name));

    console.log("Seeding firms...");
    await insertSeedFirms();

    console.log("Seeding portfolio items...");
    await seedPortfolioItems(profilesByEmail);

    console.log("Seeding job listings...");
    await insertSeedJobs(authUsersByEmail);

    console.log("Seeding bookmarks...");
    const { data: seededJobs, error: jobLookupError } = await supabase
        .from("job_listings")
        .select("id, title, user_id")
        .in("title", seedJobsData.map((job) => job.title));

    if (jobLookupError) {
        throw new Error(`Unable to fetch seeded job ids: ${jobLookupError.message}`);
    }

    const jobIndexByTitle = new Map((seededJobs ?? []).map((job) => [job.title, job]));
    await insertSeedBookmarks(authUsersByEmail, jobIndexByTitle);

    const summary = {
        auth_users: seedUsers.length,
        profiles: profilesByEmail.size,
        portfolio_items: seedUsers.reduce((total, spec) => total + (portfolioByEmail[spec.email]?.length ?? spec.portfolioItems?.length ?? 0), 0),
        job_listings: seedJobsData.length,
        bookmarks: seedBookmarksData.length,
        firms: seedFirmsData.length,
    };

    console.log("Seed complete.");
    console.log(summary);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
