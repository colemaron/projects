const sliders = Array.from(document.querySelectorAll("input[type='range']"));

function updateSlider(slider) {
	const sliderValue = slider.nextSibling;
	sliderValue.textContent = slider.value;
}

sliders.forEach(slider => {
	updateSlider(slider);

	slider.oninput = () => updateSlider(slider);

	slider.onmouseenter = () => {
		slider.onwheel = (event) => {
			const scroll = Math.sign(event.deltaY);
			const multiplier = event.shiftKey ? 10 : 1;

			slider.value -= scroll * slider.step * multiplier;

			updateSlider(slider);
		}
	}
})