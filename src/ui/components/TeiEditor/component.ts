import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { parse_tei } from './tei';

export default class TeiEditor extends Component {
    @tracked file_body: string = 'Start';

    public setBlockAttribute(attribute, value, ev) {
        ev.preventDefault();
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
                    parse_tei(ev.target.result);
                    component.file_body = 'Testing';
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }
}
