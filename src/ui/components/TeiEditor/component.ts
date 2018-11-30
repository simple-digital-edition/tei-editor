import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { TEIParser } from './tei';

export default class TeiEditor extends Component {
    @tracked file_body: object = null;

    public setBlockAttribute(attribute, value, ev) {
        ev.preventDefault();
    }

    public editorChange(state) {
    }

    public loadFile(ev) {
        ev.preventDefault();
        let component = this;
        let fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('class', 'hidden');
        document.querySelector('body').appendChild(fileSelector);
        fileSelector.click();
        fileSelector.addEventListener('change', function(ev) {
            let files = (<HTMLInputElement>ev.target).files;
            if (files.length > 0) {
                let reader = new FileReader();
                reader.onload = (ev) => {
                    let parser = new TEIParser(ev.target.result);
                    component.file_body = parser.body;
                    //let result = parse_tei(ev.target.result);
                    //component.file_body = result.body;
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }
}
