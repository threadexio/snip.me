function show_popup(popup, cb, ms) {
	if (ms === undefined) {
		ms = 1000
	}

	cb(popup);

	popup.style.opacity = 1000;
	setTimeout(() => {
		popup.style.opacity = 0;
	}, ms)
}

function register_on_enter(input, cb) {
	input.oninput = cb;
	input.onkeydown = (event) => {
		event = event || window.event;
		if (event.key === 'Enter') {
			event.preventDefault();
			cb(input);
		}
	}

	// call once to initialize
	cb();
}

function register_on_change(input, cb) {
	input.onchange = cb;
	cb();
}

/**
 * Setup the ability to drag `e` around the viewport.
 *
 * @param e The element that will be moved.
 * @param f A function that will return the element that will act as the drag handle.
 */
function setup_drag_action(e, f) {
	var old_pos_x = 0;
	var old_pos_y = 0;

	f().onmousedown = start_drag_action;

	function start_drag_action(event) {
		event = event || window.event;
		event.preventDefault();

		old_pos_x = event.clientX;
		old_pos_y = event.clientY;

		document.onmousemove = update_pos;
		document.onmouseup = stop_drag_action;

		return false;
	}

	function stop_drag_action(event) {
		event = event || window.event;
		event.preventDefault();

		document.onmousemove = null;
		document.onmouseup = null;
	}

	function update_pos(event) {
		event = event || window.event;
		event.preventDefault();

		let new_pos_x = event.clientX;
		let new_pos_y = event.clientY;

		let delta_x = new_pos_x - old_pos_x;
		let delta_y = new_pos_y - old_pos_y;

		old_pos_x = new_pos_x;
		old_pos_y = new_pos_y;

		let offset_x = e.offsetLeft + delta_x;
		let offset_y = e.offsetTop + delta_y;

		e.style.left = `${offset_x}px`;
		e.style.top = `${offset_y}px`;
	}
}

var preview = document.getElementById("preview");
var renderer = markdownit({
	html: true,
	xhtmlOut: true,
	breaks: false,
	langPrefix: 'language-',
	linkify: false,
	typographer: true,
	highlight: function (str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(str, { language: lang }).value;
			} catch (__) { }
		} else {
			return '';
		}
	}
})
	.use(markdownitEmoji)
	.use(markdownitMath);

var themes = {
	'Pink-Purple': {
		background: 'linear-gradient(135deg, rgba(207, 47, 152, 1) 0%, rgba(106, 61, 236, 1) 100%)',
	},
	'White-Gray': {
		background: 'linear-gradient(135deg, rgba(235,235,235,1) 0%, rgba(164,164,164,1) 100%)',
	},
	'Red-Blue-Black': {
		background: 'linear-gradient(135deg, rgba(196,0,0,1) 0%, rgba(0,0,128,1) 50%, rgba(0,0,0,1) 100%)',
	},
	'Transparent': {
		background: 'none',
	},
};

function set_theme(theme_name) {
	let theme = themes[theme_name];
	if (theme === undefined) {
		return;
	}

	preview.style.background = theme.background;
}

var export_types = {
	'PNG': (preview) => {
		domtoimage.toPng(preview).then((data) => {
			saveAs(data, "snippet.png");
		});
	},
	'JPEG': (preview) => {
		domtoimage.toJpeg(preview).then((data) => {
			saveAs(data, "snippet.jpg");
		})
	},
	'SVG': (preview) => {
		domtoimage.toSvg(preview).then((data) => {
			saveAs(data, "snippet.svg");
		});
	},
};

function export_preview(export_type) {
	let export_cb = export_types[export_type];
	export_cb(preview);
}

// Size Controls
{
	let size_popup = document.getElementById("preview-size-popup");

	function update_size_popup() {
		show_popup(size_popup, (p) => {
			let x = preview.clientWidth;
			let y = preview.clientHeight;
			p.innerText = `${x}x${y}`;
		});
	}

	let width_slider = document.getElementById("preview-width-slider");
	register_on_enter(width_slider, () => {
		preview.style.width = width_slider.value;
		update_size_popup();
	});

	let height_slider = document.getElementById("preview-height-slider");
	register_on_enter(height_slider, () => {
		preview.style.height = height_slider.value;
		update_size_popup();
	});

	let padding_input = document.getElementById("preview-padding-input");
	register_on_enter(padding_input, () => {
		if (padding_input.value === "0") {
			// round out the corners so we dont end up with mismatching corners
			// between the preview and the actual window
			preview.style.borderRadius = window.getComputedStyle(preview).getPropertyValue("--border-radius");
		} else {
			preview.style.borderRadius = "";
		}

		preview.style.padding = `${padding_input.value}px`;
	});
}

// Content Controls
{

	let content_output = document.getElementById("window-content");
	let content_input = document.getElementById("editor-content");
	register_on_enter(content_input, () => {
		content_output.innerHTML = renderer.render(content_input.value);
	});
	content_input.onkeydown = null;

	let title_output = document.getElementById("window-title");
	let title_input = document.getElementById("title-input");
	register_on_enter(title_input, () => {
		title_output.innerHTML = renderer.renderInline(title_input.value);
	});

	let font_size_input = document.getElementById("editor-font-size-input");
	register_on_enter(font_size_input, () => {
		content_output.style.fontSize = font_size_input.value;
	});

	{
		let background_select = document.getElementById("background-theme-selector");
		for (const name of Object.keys(themes)) {
			let option = document.createElement("option");
			option.value = name;
			option.innerText = name;
			background_select.appendChild(option);
		}

		let update_theme = () => {
			set_theme(background_select.value)
		};
		background_select.onchange = update_theme;
		update_theme();
	}

	{
		let export_selector = document.getElementById("export-selector");
		for (const export_type of Object.keys(export_types)) {
			let option = document.createElement("option");
			option.value = export_type;
			option.innerHTML = export_type;
			export_selector.appendChild(option);
		}

		document.getElementById("export-button").onclick = () => {
			export_preview(export_selector.value);
		};
	}
}

// Make control panels moveable
document.querySelectorAll(".control-pane>.control-pane-handle").forEach((handle) => {
	let e = handle.parentElement;
	setup_drag_action(e, () => handle);
});

