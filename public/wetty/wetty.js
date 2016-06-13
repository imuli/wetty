var term;
var socket = io(location.origin, {path: '/wetty/socket.io'})
var buf = '';

function Wetty(argv) {
    this.argv_ = argv;
    this.io = null;
    this.pid_ = -1;
}

Wetty.prototype.run = function() {
    this.io = this.argv_.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this);
    this.io.sendString = this.sendString_.bind(this);
    this.io.onTerminalResize = this.onTerminalResize.bind(this);
}

Wetty.prototype.sendString_ = function(str) {
    socket.emit('input', str);
};

Wetty.prototype.onTerminalResize = function(col, row) {
    socket.emit('resize', { col: col, row: row });
};

socket.on('connect', function() {
    lib.init(function() {
        hterm.defaultStorage = new lib.Storage.Local();
        term = new hterm.Terminal();
        window.term = term;
        term.decorate(document.getElementById('terminal'));

        term.setCursorPosition(0, 0);
        term.setCursorVisible(true);
        term.prefs_.set('background-color', '#000000');
		term.prefs_.set('color-palette-overrides', [
				'#1b1b1b',
				'#b75e03',
				'#098948',
				'#548404',
				'#7e5cff',
				'#e3057b',
				'#0580b8',
				'#b9b9b9',
				'#3b3b3b',
				'#eb0107',
				'#078a0c',
				'#7a7b00',
				'#0175f9',
				'#d205d3',
				'#068589',
				'#ffffff',
		]);
        term.prefs_.set('foreground-color', '#777777');
        term.prefs_.set('enable-bold', true);
        term.prefs_.set('enable-bold-as-bright', false);
        term.prefs_.set('font-size', 12);
        term.prefs_.set('scrollbar-visible', false);
        term.prefs_.set('use-default-window-copy', true);

        term.runCommandClass(Wetty, document.location.hash.substr(1));
        socket.emit('resize', {
            col: term.screenSize.width,
            row: term.screenSize.height
        });

        if (buf && buf != '')
        {
            term.io.writeUTF16(buf);
            buf = '';
        }
    });
});

socket.on('output', function(data) {
    if (!term) {
        buf += data;
        return;
    }
    term.io.writeUTF16(data);
});

socket.on('disconnect', function() {
    console.log("Socket.io connection closed");
});
