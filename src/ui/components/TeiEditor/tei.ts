function parse_header() {

}

function parse_body() {

}

export function parse_tei(data: string) {
    let parser = new DOMParser();
    let teiDom = parser.parseFromString(data, 'application/xml');
    console.log(teiDom.documentElement);
}

export default null;
