export interface RIOXML {
    '?xml': string;
    'p:RegisterInternetdomeinenOverheid': {
        'p:organisatie': {
            'p:naam': string;
            'p:afkorting': string;
            'p:types': { 'p:type': string | string[] };
            'p:overzichtURL': string;
            'p:contact': {
                'p:telefoon': string;
                'p:emailadres': string;
                'p:url': string;
            };
            'p:domeinnaamregistraties': { 'p:domeinnaamregistratie': [Object] };
            'p:domeinen': { 'p:domein': [Object] };
        }[];
    };
}

export interface RIORow {
    'Officiële naam': string;
    'Alternatieve naam': string;
    'Afkorting': string;
    'Type': string;
    'Subtype': string;
    'Startdatum': string;
    'Einddatum': string;
    'Datum ter verificatie': string;
    'Laatste mutatie': string;
    'Classificaties': string;
    'Onderdeel van': string;
    'Organisatiebeschrijving/doel': string;
    'Link naar uitgebreidere organisatiebeschrijving': string;
    'Adressen (type, toelichting, straat, huisnummer, toevoeging, postbus, postcode, plaats, regio, provincieAfkorting, land, centroideLatitude, centroideLongitude, centroideRdx, centroideRdy)': string;
    'Online afspraak url': string;
    'Afspraak per email': string;
    'Telefonische afspraak': string;
    'Telefoonnummers ': string;
    'Fax': string;
    'E-mail adressen': string;
    'Internetpagina\'s': string;
    'Sociale Media': string;
    'Contactpagina\'s': string;
    'Beschrijving contactgegevens': string;
    'Relatie met ministerie': string;
    'Link naar organogram': string;
    'Oppervlakte (km2)': string;
    'Wateroppervlakte (km2)': string;
    'Bevat plaatsen': string;
    'Aantal inwoners': string;
    'Inwoners per km2': string;
    'Totaal aantal zetels': string;
    'Raad (Partij (aantal zetels))': string;
    'Beleidsterreinen': string;
    'Datum van publiceren begroting': string;
    'Actieve afwijkingen van de Regeling': string;
    'OWMS URI': string;
    'TOOi URI': string;
    'KVK-nummer': string;
    'btw-nummer': string;
    'Loonheffingennummer': string;
    'OIN': string;
    'Organisatiecode': string;
    'Actieve beheerder ROO': string;
}
