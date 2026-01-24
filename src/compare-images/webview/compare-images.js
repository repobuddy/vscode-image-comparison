const slider = document.getElementById("slider");
const overlay = document.getElementById("overlay");

if (slider && overlay) {
  const updateOverlay = (value) => {
    overlay.style.width = `${value}%`;
  };

  slider.addEventListener("input", (event) => {
    updateOverlay(event.target.value);
  });

  updateOverlay(slider.value);
}
