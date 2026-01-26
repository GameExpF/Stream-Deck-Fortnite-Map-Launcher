const { streamDeckClient } = SDPIComponents;

let featureFridayData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const $SD = streamDeckClient;
    const refreshBtn = document.getElementById('refresh-btn');
    const testerSelect = document.getElementById('tester-select');
    // const mapSelect = document.getElementById('map-select');

    // if (mapSelect) {
    //     mapSelect.addEventListener('input', () => {
    //         // Trigger settings update to calculate mapIndex
    //         // if ($SD) $SD.getSettings();
    //     });
    // }

    if (testerSelect) {
        testerSelect.addEventListener('input', (e) => {
            setTimeout(() => {
                console.log(e)
                updateMapList(testerSelect.value);
            }, 0)
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            isLoadingData = true;
            refreshBtn.disabled = true;
            fetch('https://www.olilz.xyz/api/playtests/maps')
            // fetch('http://127.0.0.1:5000/feature-friday/current')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    featureFridayData = data;
                    if ($SD) $SD.setGlobalSettings({ featureFridayData: data });
                    updateUI();
                })
                .catch(err => {
                    console.error("Failed to fetch data", err);
                })
                .finally(() => {
                    refreshBtn.disabled = false;
                })
            });
    }

    if ($SD) {

        $SD.didReceiveGlobalSettings.subscribe(() => {
            (jsonObj) => {
                console.log("didReceiveGlobalSettings", jsonObj)
                if (jsonObj.payload.settings && jsonObj.payload.settings.featureFridayData) {
                    featureFridayData = jsonObj.payload.settings.featureFridayData;
                    updateUI();
                }
            }
        });

        $SD.didReceiveSettings.subscribe((jsonObj) => {
            console.log("didReceiveSettings", jsonObj)
            const settings = jsonObj.payload.settings;
            if (featureFridayData && settings.mapCode && settings.tester) {
                const testerMaps = featureFridayData.maps.filter(m => m.teamLeader === settings.tester);
                const index = testerMaps.findIndex(m => m.code === settings.mapCode);
                if (index !== -1) {
                    const newIndex = index + 1;
                    if (settings.mapIndex !== newIndex) {
                        settings.mapIndex = newIndex;
                        $SD.setSettings(settings);
                    }
                }
            }
        });

        globalData = await $SD.getGlobalSettings()
        if (globalData && globalData.featureFridayData) {
            featureFridayData = globalData.featureFridayData;
            updateUI();
        }
    }
});

function updateUI() {
    if (!featureFridayData) return;
    console.log("updateUI", featureFridayData)
    document.getElementById('week-display').innerText = `Week #${featureFridayData.weekNumber}`;
    const testerSelect = document.getElementById('tester-select');
    const testers = [...new Set(featureFridayData.maps.map(m => m.teamLeader))];
    testerSelect.innerHTML = '<option value="none">None</option>';
    testers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.innerText = t;
        testerSelect.appendChild(opt);
    });
    // Add the currently selected tester if not in the list
    if (testerSelect.value !== 'none' && !testers.includes(testerSelect.value)) {
        const opt = document.createElement('option');
        opt.value = testerSelect.value;
        opt.innerText = testerSelect.value;
        testerSelect.appendChild(opt);
    }
    updateMapList(testerSelect.value);
}

function updateMapList(tester) {
    if (!featureFridayData) return;
    console.log(`updateMapList ${tester}`)
    const mapSelect = document.getElementById('map-select');
    const maps = featureFridayData.maps.filter(m => m.teamLeader === tester);
    mapSelect.innerHTML = '<option value="none">None</option>';
    maps.forEach((m, ind) => {
        const opt = document.createElement('option');
        opt.value = ind + 1;
        opt.innerText = `${m.code}: ${m.title}`;
        mapSelect.appendChild(opt);
    });
}