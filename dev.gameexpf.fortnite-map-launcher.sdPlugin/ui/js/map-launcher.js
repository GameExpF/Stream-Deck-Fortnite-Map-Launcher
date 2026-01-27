const { streamDeckClient } = SDPIComponents;

function validateMapCode() {
    const field = document.querySelector('sdpi-textfield[setting="mapCode"]');
    if (!field) return;
    let rawValue = field.value;
    
    if (typeof rawValue === 'undefined') {
        const internalInput = field.querySelector('input');
        rawValue = internalInput ? internalInput.value : "";
    }

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
        const load_btn = document.getElementById('load-map-info');
        if (load_btn) {
            load_btn.addEventListener('click', () => {
                if (field.value.length === 14) {
                    fetch(`https://fchq.io/api/map/${field.value}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! Status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log(data);
                            const $SD = streamDeckClient;
                            if ($SD) {
                                $SD.send("sendToPlugin", {
                                    command: "updateMapInfo",
                                    payload: data
                                })
                            }
                        })
                        .catch(err => {
                            console.error("Failed to fetch data", err);
                        })
                        .finally(() => {
                        })
                }
            });
        }
        const reset = document.getElementById('reset-map-img');
        if (reset) {
            reset.addEventListener('click', () => {
                const $SD = streamDeckClient;
                if ($SD) {
                    $SD.send("sendToPlugin", {
                        command: "resetMapImg"
                    })
                }
            });
        }
    }, 100);
});