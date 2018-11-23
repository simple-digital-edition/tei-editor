import Component from '@glimmer/component';

export default class TeiEditor extends Component {
    public setBlockAttribute(attribute, value, ev) {
        ev.preventDefault();
    }

    public loadFile(ev) {
        ev.preventDefault();
        let fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('class', 'hidden');
        document.querySelector('body').append(fileSelector);
        fileSelector.click();
        fileSelector.addEventListener('change', function(ev) {
            let files = ev.target.files;
            if (files.length > 0) {
                let reader = new FileReader();
                reader.onload = (ev) => {
                    // ev.target.result holds the file
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }
}
