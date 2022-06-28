import * as JSURL from "jsurl"
import { compress } from 'compress-json'

window.addEventListener("load", function () {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const form  = document.getElementsByTagName('form')[0];

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const inputs  = document.getElementsByClassName('data-input-form');
        console.log(inputs);
        const values = Array.from(inputs).map((e) => {return e.value});
        const encoded = JSURL.stringify(compress(values))
        document.getElementById("copyTarget").value = window.location.href + "fam/?path=" + encoded;

        form.classList.add('was-validated');
    }, false)

    const tooltip = document.getElementById("copyButton");
    new bootstrap.Tooltip(tooltip);
    tooltip.addEventListener('click', () => {
        var copyText = document.getElementById("copyTarget");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);

        var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
        tooltip.setContent({ '.tooltip-inner': 'Copied' });
    })
    tooltip.addEventListener('mouseleave', () => {
        var tooltip = bootstrap.Tooltip.getOrCreateInstance(document.getElementById("copyButton"));
        tooltip.setContent({ '.tooltip-inner': 'Copy to clipboard' });
    })

});
