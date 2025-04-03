        let directoryHandle = null;
        let fileHandle = null;
        let fileContent = [];

        async function showScreen(screenId) {
            document.querySelectorAll(".container").forEach(el => el.classList.remove("active"));
            setTimeout(() => {
                document.getElementById(screenId).classList.add("active");
            }, 10);
        }

        async function getDirectory() {
            if (directoryHandle) return directoryHandle;

            try {
                directoryHandle = await window.showDirectoryPicker();
                return directoryHandle;
            } catch (error) {
                alert("Permission denied. Please allow access.");
                return null;
            }
        }

        async function createFile() {
            const firstName = document.getElementById("firstName").value.trim();
            const lastName = document.getElementById("lastName").value.trim();
            const acCount = parseInt(document.getElementById("acCount").value.trim());
            const dcCount = parseInt(document.getElementById("dcCount").value.trim());

            if (!firstName || !lastName || isNaN(acCount) || isNaN(dcCount) || acCount <= 0 || dcCount <= 0) {
                alert("Please enter valid positive numbers for AC and DC pins.");
                return;
            }

            try {
                document.getElementById("loading").style.display = "block";

                const dirHandle = await getDirectory();
                if (!dirHandle) return;

                fileHandle = await dirHandle.getFileHandle(`${firstName}_${lastName}.txt`, { create: true });

                fileContent = [];
                for (let i = 1; i <= acCount; i++) fileContent.push(`AC ${i}: OFF`);
                for (let i = 1; i <= dcCount; i++) fileContent.push(`DC ${i}: OFF`);

                await updateFile();
                document.getElementById("fileName").innerText = `File: ${firstName}_${lastName}.txt`;
                showScreen("switchScreen");
                loadSwitches();
            } catch (error) {
                alert("Error: Unable to create file.");
            } finally {
                document.getElementById("loading").style.display = "none";
            }
        }

        async function openFile() {
            try {
                document.getElementById("loading").style.display = "block";
                [fileHandle] = await window.showOpenFilePicker();
                const file = await fileHandle.getFile();
                fileContent = (await file.text()).split("\n");

                document.getElementById("fileName").innerText = `File: ${file.name}`;
                showScreen("switchScreen");
                loadSwitches();
            } catch (error) {
                alert("Error: Unable to open file.");
            } finally {
                document.getElementById("loading").style.display = "none";
            }
        }

		
		        function loadSwitches() {
            const acContainer = document.getElementById("acContainer");
            const dcContainer = document.getElementById("dcContainer");
            acContainer.innerHTML = "";
            dcContainer.innerHTML = "";

            fileContent.forEach((line, index) => {
                if (line.trim()) {
                    const [label, state] = line.split(": ");
                    const isOn = state === "ON";
                    const switchHTML = `
                        <div class="switch-box">
                            <p>${label}</p>
                            <button class="toggle-btn ${isOn ? 'on' : ''}" onclick="toggleSwitch(${index})">
                                ${isOn ? 'ON' : 'OFF'}
                            </button>
                        </div>`;

                    if (label.startsWith("AC")) {
                        acContainer.innerHTML += switchHTML;
                    } else if (label.startsWith("DC")) {
                        dcContainer.innerHTML += switchHTML;
                    }
                }
            });
        }
         async function toggleSwitch(index) {
            if (!fileHandle) return;

            const [label, state] = fileContent[index].split(": ");
            const newState = state === "ON" ? "OFF" : "ON";
            fileContent[index] = `${label}: ${newState}`;

            await updateFile();
            loadSwitches();
        }

        async function updateFile() {
            if (!fileHandle) return;
            const writable = await fileHandle.createWritable();
            await writable.write(fileContent.join("\n"));
            await writable.close();
        }
