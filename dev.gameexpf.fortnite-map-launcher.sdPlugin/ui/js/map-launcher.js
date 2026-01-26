const { streamDeckClient } = SDPIComponents;

function validateMapCode() {
    const field = document.querySelector('sdpi-textfield[setting="mapCode"]');
    if (!field) return;
    let rawValue = field.value;
    
    if (typeof rawValue === 'undefined') {
        const internalInput = field.querySelector('input');
        rawValue = internalInput ? internalInput.value : "";
    }

    // 3. Process the text
    let digits = rawValue.replace(/\D/g, '');
    
    if (digits.length > 12) {
        digits = digits.slice(0, 12);
    }

    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1-');

    field.value = formatted;

    const btn = document.querySelector('sdpi-button');
    if (btn) {
        btn.disabled = (formatted.length !== 14);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const field = document.querySelector('sdpi-textfield[setting="mapCode"]');
        if (field) {
            field.addEventListener('input', validateMapCode);
            validateMapCode();
        }
        // const load_btn = document.getElementById('load-map-info');
        // if (load_btn) {
        //     load_btn.addEventListener('click', () => {
        //         streamDeckClient.SendToPlugin({"action": "refreshMapData"});
        //     });
        // }
        // const con_btn = document.getElementById('connect-api');
        // if (con_btn) {
        //     con_btn.addEventListener('click', () => {
                
        //     });
        // }
    }, 100);
});