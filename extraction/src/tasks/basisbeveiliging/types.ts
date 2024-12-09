export interface BasisBeveiligingConfig {
    annotations: string[][];
    layout: Layout[];
    show: Show;
    announcement: string;
    disclaimer: string;
    responsible_organization: Responsibleorganization;
    public_submissions: Publicsubmissions;
    leaderboard: Leaderboard;
    project: Project;
    responsible_disclosure_page: Responsibledisclosurepage;
    translation: Translation;
    comply_or_explain: Complyorexplain;
    send_in_new_domains: Sendinnewdomains;
    incorrect_finding: Sendinnewdomains;
    debug: boolean;
    admin: boolean;
    country_and_layers: Countryandlayers;
    google_maps_api_key: string;
    grading_policy: string;
    app: App;
    scan_types: Scantypes;
}
export interface Scantypes {
    dnssec: Dnssec;
    tls_qualys_encryption_quality: Dnssec;
    tls_qualys_certificate_trusted: Dnssec;
    ftp: Dnssec;
    bannergrab: Dnssec;
    ports: Dnssec;
    whois_domain_ownership: Dnssec;
    location_server: Dnssec;
    location_mail_server: Dnssec;
    location_third_party_website_content: Dnssec;
    internet_nl_web_tls: Dnssec;
    internet_nl_wsm_web_appsecpriv_securitytxt: Dnssec;
    internet_nl_web_rpki_exists: Dnssec;
    internet_nl_mail_auth_dmarc_exist: Dnssec;
    internet_nl_mail_auth_dkim_exist: Dnssec;
    internet_nl_mail_auth_spf_exist: Dnssec;
    internet_nl_mail_starttls_tls_available: Dnssec;
    internet_nl_mail_tls: Dnssec;
    internet_nl_mail_rpki_exists: Dnssec;
    http_security_header_strict_transport_security: Dnssec;
    http_security_header_x_content_type_options: Dnssec;
    http_security_header_x_frame_options: Dnssec;
    web_privacy_third_party_requests: Dnssec;
    web_privacy_tracking: Dnssec;
    web_privacy_cookie_products_no_consent: Dnssec;
}
export interface Dnssec {
    'name': string;
    'id': number;
    'category': string[];
    'relevant impacts': string[];
    'documentation links': DocumentationLink[];
    'second opinion links': DocumentationLink[];
}
export interface DocumentationLink {
    name: string;
    url: string;
}
export interface App {
    supported_locales: string[];
    menu: string;
    custom_css: string;
    logo_image: string;
    favicon: string;
    thank_you_email_address: string;
    send_to_supplier_bcc_address: string;
    regions: Regions;
    relevant_for_ui: Relevantforui;
    landing_pages: Landingpages;
}
export interface Landingpages {
    'embargo/': Embargo;
    'gemeente': Embargo;
    'gemeente/': Embargo;
    'gemeenten': Embargo;
    'gemeenten/': Embargo;
    'provincie': Embargo;
    'provincie/': Embargo;
    'provincies': Embargo;
    'provincies/': Embargo;
    'overheid/': Embargo;
    'overheid': Embargo;
    'overheden': Embargo;
    'overheden/': Embargo;
    'government/': Embargo;
    'government': Embargo;
    'testing1244': Embargo;
    'zorgpreview/': Embargo;
    'zorgpreview': Embargo;
    'zorg': Embargo;
    'zorg/': Embargo;
}
export interface Embargo {
    country: string;
    layer: string;
}
export interface Relevantforui {
    high: boolean;
    medium: boolean;
    low: boolean;
    good: boolean;
}
export interface Regions {
    mail: Mail;
    server: Mail;
    content: Mail;
}
export interface Mail {
    countries: Countries;
    continents: Countries;
}
export interface Countries {
    ok: string[];
    low: string[];
    medium: any[];
    high: any[];
}
export interface Countryandlayers {
    NL: NL;
}
export interface NL {
    code: string;
    name: string;
    flag: string;
    layers: string[];
}
export interface Sendinnewdomains {
    email_address: string;
}
export interface Complyorexplain {
    forum_link: string;
    email_address: string;
}
export interface Translation {
    nl: Nl;
    en: En;
}
export interface En {
    layer: Layer2;
    category: Category;
    group: Group;
    info: Info2;
    intro: Intro;
    search: Search;
    footer: Footer;
    finding: Finding;
    organization: Organization;
}
export interface Info2 {
    info_title: string;
    info_heading: string;
    info_title_1: string;
    info_content_1: string;
    info_title_2: string;
    info_content_2: string;
    info_title_3: string;
    info_content_3: string;
    info_title_4: string;
    info_content_4: string;
    info_title_5: string;
    info_content_5: string;
}
export interface Layer2 {
    'layer_municipality': string;
    'layer_unknown': string;
    'layer_water_board': string;
    'layer_province': string;
    'layer_country': string;
    'layer_region': string;
    'layer_arrondissements': string;
    'layer_county': string;
    'layer_district': string;
    'layer_government': string;
    'layer_healthcare': string;
    'layer_finance': string;
    'layer_state': string;
    'layer_education': string;
    'layer_arrangements': string;
    'layer_central_government': string;
    'layer_central_government_general_affairs': string;
    'layer_central_government_interior_relations': string;
    'layer_central_government_foreign_affairs': string;
    'layer_central_government_defense': string;
    'layer_central_government_economy': string;
    'layer_central_government_finance': string;
    'layer_central_government_infrastructure': string;
    'layer_central_government_justice': string;
    'layer_central_government_agriculture': string;
    'layer_central_government_education': string;
    'layer_central_government_employment': string;
    'layer_central_government_health': string;
    'layer_safety_region': string;
    'layer_nl_overseas_countries': string;
    'layer_nl_overseas_municipalities': string;
    'layer_nl_overseas_northern_islands': string;
    'layer_nl_overseas_southern_islands': string;
    'layer_political_parties': string;
    'layer_cyber': string;
    'layer_waterschappen': string;
    'layer_adviescolleges': string;
    'layer_zelfstandige-bestuursorganen': string;
    'layer_agentschappen': string;
    'layer_koepelorganisaties': string;
    'layer_openbare-lichamen-voor-beroep-en-bedrijf': string;
    'layer_saba': string;
    'layer_st_eustatius': string;
    'layer_bonaire': string;
    'layer_university': string;
    'layer_healthcare_ggd': string;
    'layer_healthcare_hospital': string;
    'layer_education_hbo': string;
    'layer_education_university': string;
    'layer_education_junior_college': string;
    'layer_education_secondary_education': string;
    'layer_energy_preview_137m3in': string;
    'layer_cyber_preview': string;
    'layer_primary_education': string;
    'layer_education_primary_education': string;
    'layer_healthcare_ggz': string;
    'layer_vital_energy_preview': string;
    'layer_vital_water_preview': string;
    'layer_cyber_non_profit': string;
    'layer_vital_finance_payment_processing_preview': string;
    'layer_vital_finance_bank_eer_dutch_market_preview': string;
    'layer_vital_finance_bank_deposit_guarantee_preview': string;
    'layer_vital_energy': string;
    'layer_vital_digital_infra_cloud_preview': string;
    'layer_vital_digital_infra_cloud': string;
    'layer_vital_digital_infra_dns_preview': string;
    'layer_vital_digital_infra_dns': string;
    'layer_vital_digital_infra_datacenter_preview': string;
    'layer_vital_digital_infra_datacenter': string;
    'layer_vital_digital_infra_ix_preview': string;
    'layer_vital_digital_infra_ix': string;
    'layer_vital_digital_infra_isp_preview': string;
    'layer_vital_digital_infra_isp': string;
    'layer_vital_digital_infra_msp_preview': string;
    'layer_vital_digital_infra_msp': string;
    'layer_vital_digital_infra_hosting_preview': string;
    'layer_vital_digital_infra_hosting': string;
    'layer_mkb': string;
    'layer_vital_finance_bank_deposit_guarantee': string;
    'layer_vital_finance_bank_eer_dutch_market': string;
    'layer_vital_finance_payment_processing': string;
}
export interface Nl {
    layer: Layer;
    category: Category;
    group: Group;
    info: Info;
    intro: Intro;
    search: Search;
    footer: Footer;
    finding: Finding;
    organization: NlOrganization;
}
export interface NlOrganization {
    organization_mail_new_domains_subject: string;
    organization_mail_new_domain_body: string;
}
export interface Finding {
    finding_mail_thank_you_subject: string;
    finding_mail_thank_you_body: string;
    finding_mail_will_fix_subject: string;
    finding_mail_will_fix_body: string;
    finding_mail_send_to_supplier_subject: string;
    finding_mail_send_to_supplier_body: string;
    finding_mail_comply_or_explain_subject: string;
    finding_mail_comply_or_explain_body: string;
    finding_mail_incorrect_subject: string;
    finding_mail_incorrect_body: string;
}
export interface Footer {
    footer_content: string;
}
export interface Search {
    site_wide_search_title: string;
}
export interface Intro {
    intro_title: string;
    intro_leader: string;
}
export interface Info {
    info_title: string;
    info_heading: string;
    info_title_1: string;
    info_content_1: string;
    info_title_2: string;
    info_content_2: string;
    info_title_3: string;
    info_content_3: string;
    info_title_4: string;
    info_content_4: string;
    info_content_5: string;
}
export interface Group {
    group_header_highlight: string;
    group_header_government: string;
    group_header_education: string;
    group_header_healthcare: string;
    group_header_political_parties: string;
    group_header_ministries: string;
    group_header_public_bodies: string;
    group_header_other_governments: string;
    group_description_highlight: string;
    group_description_government: string;
    group_description_education: string;
    group_description_healthcare: string;
    group_description_political_parties: string;
    group_description_ministries: string;
    group_description_public_bodies: string;
    group_description_other_governments: string;
    group_header_cyber: string;
    group_description_cyber: string;
    group_header_vital: string;
    group_description_vital: string;
}
export interface Category {
    category_email: string;
    category_website: string;
    category_privacy: string;
    category_confidentiality: string;
    category_integrity: string;
    category_availability: string;
    category_ftp: string;
    category_dns: string;
    category_law: string;
}
export interface Layer {
    'layer_municipality': string;
    'layer_unknown': string;
    'layer_water_board': string;
    'layer_province': string;
    'layer_country': string;
    'layer_region': string;
    'layer_arrondissements': string;
    'layer_county': string;
    'layer_district': string;
    'layer_government': string;
    'layer_healthcare': string;
    'layer_finance': string;
    'layer_state': string;
    'layer_education': string;
    'layer_arrangements': string;
    'layer_central_government': string;
    'layer_central_government_general_affairs': string;
    'layer_central_government_interior_relations': string;
    'layer_central_government_foreign_affairs': string;
    'layer_central_government_defense': string;
    'layer_central_government_economy': string;
    'layer_central_government_finance': string;
    'layer_central_government_infrastructure': string;
    'layer_central_government_justice': string;
    'layer_central_government_agriculture': string;
    'layer_central_government_education': string;
    'layer_central_government_employment': string;
    'layer_central_government_health': string;
    'layer_safety_region': string;
    'layer_nl_overseas_countries': string;
    'layer_nl_overseas_municipalities': string;
    'layer_nl_overseas_northern_islands': string;
    'layer_nl_overseas_southern_islands': string;
    'layer_political_parties': string;
    'layer_cyber': string;
    'layer_waterschappen': string;
    'layer_adviescolleges': string;
    'layer_zelfstandige-bestuursorganen': string;
    'layer_agentschappen': string;
    'layer_koepelorganisaties': string;
    'layer_openbare-lichamen-voor-beroep-en-bedrijf': string;
    'layer_saba': string;
    'layer_st_eustatius': string;
    'layer_bonaire': string;
    'layer_university': string;
    'layer_healthcare_ggd': string;
    'layer_healthcare_hospital': string;
    'layer_education_hbo': string;
    'layer_education_university': string;
    'layer_education_junior_college': string;
    'layer_education_secondary_education': string;
    'layer_energy_preview_137m3in': string;
    'layer_cyber_preview': string;
    'layer_primary_education': string;
    'layer_education_primary_education': string;
    'layer_healthcare_ggz': string;
    'layer_vital_energy_preview': string;
    'layer_vital_water_preview': string;
    'layer_cyber_non_profit': string;
    'layer_vital_finance_payment_processing_preview': string;
    'layer_vital_finance_bank_eer_dutch_market_preview': string;
    'layer_vital_finance_bank_deposit_guarantee_preview': string;
    'layer_vital_energy': string;
    'layer_vital_digital_infra_cloud_preview': string;
    'layer_vital_digital_infra_cloud': string;
    'layer_vital_digital_infra_dns_preview': string;
    'layer_vital_digital_infra_dns': string;
    'layer_vital_digital_infra_datacenter_preview': string;
    'layer_vital_digital_infra_datacenter': string;
    'layer_vital_digital_infra_ix_preview': string;
    'layer_vital_digital_infra_ix': string;
    'layer_vital_digital_infra_isp_preview': string;
    'layer_vital_digital_infra_isp': string;
    'layer_vital_digital_infra_msp_preview': string;
    'layer_vital_digital_infra_msp': string;
    'layer_vital_digital_infra_hosting_preview': string;
    'layer_vital_digital_infra_hosting': string;
    'layer_vital_finance_bank_deposit_guarantee': string;
    'layer_vital_finance_bank_eer_dutch_market': string;
    'layer_vital_finance_payment_processing': string;
}
export interface Responsibledisclosurepage {
    show: boolean;
    email_address: string;
    pgp_key: string;
    salsa_key: string;
}
export interface Project {
    name: string;
    tagline: string;
    country: string;
    mail: string;
    issue_mail: string;
    twitter: string;
    facebook: string;
}
export interface Leaderboard {
    show: boolean;
    default_order: string[];
}
export interface Publicsubmissions {
    enabled: boolean;
}
export interface Responsibleorganization {
    name: string;
    promo_text: string;
    website: string;
    mail: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
    phone: string;
}
export interface Show {
    intro: boolean;
    multi_map_summary_table: boolean;
    charts: boolean;
    comply_or_explain: boolean;
    scan_schedule: boolean;
    datasets: boolean;
    announcement: boolean;
    statistics: boolean;
    numbers: boolean;
    improvements: boolean;
    graphs: boolean;
    changes: boolean;
    ticker: boolean;
    services: boolean;
    services_table: boolean;
    plus_info: boolean;
    report_numbers: boolean;
    report_charts: boolean;
    report_charts_network: boolean;
    report_risk_summary: boolean;
    report_content: boolean;
    report_website_gallery: boolean;
    report_server_locations: boolean;
    disclaimer: boolean;
    send_in_new_domains: boolean;
    incorrect_finding: boolean;
    snow: boolean;
    login_plaza: boolean;
    cookie_plaza: boolean;
    time_machine: boolean;
    historic_comparison_reports: boolean;
    metric_progress: boolean;
    comply_or_explain_guidelines: boolean;
    geolocation_results: boolean;
    report_expert_view_certificates: boolean;
    report_expert_view_cookies: boolean;
    thank_you: boolean;
    send_to_supplier: boolean;
    leaderboard: boolean;
    socials: Socials;
    issues: Issues;
}
export interface Issues {
    bannergrab: boolean;
    dnssec: boolean;
    ftp: boolean;
    http_security_header_strict_transport_security: boolean;
    http_security_header_x_content_type_options: boolean;
    http_security_header_x_frame_options: boolean;
    internet_nl_mail_auth_dkim_exist: boolean;
    internet_nl_mail_auth_dmarc_exist: boolean;
    internet_nl_mail_auth_spf_exist: boolean;
    internet_nl_mail_rpki_exists: boolean;
    internet_nl_mail_starttls_tls_available: boolean;
    internet_nl_mail_tls: boolean;
    internet_nl_web_rpki_exists: boolean;
    internet_nl_web_tls: boolean;
    internet_nl_wsm_web_appsecpriv_securitytxt: boolean;
    location_mail_server: boolean;
    location_server: boolean;
    location_third_party_website_content: boolean;
    ports: boolean;
    tls_qualys_certificate_trusted: boolean;
    tls_qualys_encryption_quality: boolean;
    web_privacy_cookie_products_no_consent: boolean;
    web_privacy_third_party_requests: boolean;
    web_privacy_tracking: boolean;
    whois_domain_ownership: boolean;
}
export interface Socials {
    report: boolean;
    map: boolean;
    charts: boolean;
    statistics: boolean;
    multi_map: boolean;
}
export interface Layout {
    id: number;
    uid: string;
    identifier: string;
    order: number;
    rows: Row[];
}
export interface Row {
    id: number;
    uid: string;
    order: number;
    content: Content[];
}
export interface Content {
    id: number;
    uid: string;
    order: number;
    country: string;
    layer: string;
}

export interface Organization {
    id: string;
    name: string;
    wikidata: string;
    wikipedia: string;
    twitter_handle: string;
}

export interface URL {
    id: string;
    url: string;
    not_resolvable: string;
    is_dead: string;
    computed_subdomain: string;
    computed_domain: string;
    computed_suffix: string;
}
