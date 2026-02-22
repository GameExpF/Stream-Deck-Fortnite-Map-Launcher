const { streamDeckClient } = SDPIComponents;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const update = document.getElementById('update-app');
        if (update) {
            $SD = streamDeckClient;
            update.addEventListener('click', () => {
                $SD.send("sendToPlugin", {
                    command: "updateApp"
                })
            });
        }
    }, 100);
});