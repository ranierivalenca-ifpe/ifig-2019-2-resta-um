// constants
const VIEWS_DIR = 'views';

const BASE = [
  '0011100',
  '0011100',
  '1111111',
  '1112111',
  '1111111',
  '0011100',
  '0011100',
]
// const BASETABLE = [
//   [0, 0, 1, 1, 1, 0, 0],
//   [0, 0, 1, 1, 1, 0, 0],
//   [1, 1, 1, 1, 1, 1, 1],
//   [1, 1, 1, 2, 1, 1, 1],
//   [1, 1, 1, 1, 1, 1, 1],
//   [0, 0, 1, 1, 1, 0, 0],
//   [0, 0, 1, 1, 1, 0, 0]
// ];

// dependencies
const path            = require('path');
const fs              = require('fs');
const express         = require('express');
const session         = require('express-session');
const mustache        = require('mustache');
const mustacheExpress = require('mustache-express');

// useful functions
const viewDir = () => path.join(__dirname, VIEWS_DIR);
const viewFile = file => path.join(viewDir(), file);
const view = file => fs.readFileSync(viewFile(file)).toString();
const render = (file, options) => {
  return mustache.render(view(file), options);
}
const getBaseTable = () => BASE.map(l => l.split(''));

// main functions
function makeItHappen(ses, i, j) {
  var table = ses.table,
    prev_i = ses.selected[0],
    prev_j = ses.selected[1];

  // if "i" or "j" are not table indexes or if it is a zero (nothing)
  if (!table[i] || !table[i][j] || table[i][j] == 0) {
    console.log('"i" or "j" are not table indexes or if it is a zero (nothing)');
    return;
  }

  if (prev_i == -1 && prev_j == -1 && table[i][j] == 1) { // there was nothing selected and trying to select a piece
    ses.selected = [i, j];
    return;
  } else if (prev_i != -1 && prev_j != -1) { // there was something selected
    if (table[i][j] != 2) { // the moviment isn't for a empty space
      ses.selected = [-1, -1];
      return;
    }
    if (i == prev_i && j == prev_j - 2 && table[prev_i][prev_j - 1] == 1) { // 2 cols left && the middle is a piece
      table[prev_i][prev_j] = 2;
      table[prev_i][prev_j - 1] = 2;
      table[prev_i][prev_j - 2] = 1;
    } else if (i == prev_i && j == prev_j + 2 && table[prev_i][prev_j + 1] == 1) {
      table[prev_i][prev_j] = 2;
      table[prev_i][prev_j + 1] = 2;
      table[prev_i][prev_j + 2] = 1;
    } else if (i == prev_i - 2 && j == prev_j && table[prev_i - 1][prev_j] == 1) { // 2 lines up && the middle is a piece
      table[prev_i][prev_j] = 2;
      table[prev_i - 1][prev_j] = 2;
      table[prev_i - 2][prev_j] = 1;
    } else if (i == prev_i + 2 && j == prev_j && table[prev_i + 1][prev_j] == 1) {
      table[prev_i][prev_j] = 2;
      table[prev_i + 1][prev_j] = 2;
      table[prev_i + 2][prev_j] = 1;
    }
    ses.selected = [-1, -1];
  }
}

// the main app
const app = express();

// mustache settings
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// session settings
app.use(session({secret: 'proIFPE'}));

// serve static files
app.use(express.static('public'));

app.get('/', function(req, res) {
  var reset = req.query.reset;
  var session = req.session;
  if (reset || !session.table) {
    session.table = getBaseTable();
    session.selected = [-1, -1];
    res.redirect('/');
    return;
  }

  var req_i = parseInt(req.query.i);
  var req_j = parseInt(req.query.j);

  if (session.table[req_i] && session.table[req_i][req_j]) {
    makeItHappen(session, req_i, req_j);
    res.redirect('/');
    return;
  }

  var table = session.table || false;
  var selected = session.selected || false;

  // console.log(req.query);
  // console.log(session);
  // console.log('--');

  var cells = '';
  for (i = 0; i < table.length; i++) {
    for (j = 0; j < table[i].length; j++) {
      var url = `/?i=${i}&j=${j}`;
      if (table[i][j] == 0) {
        url = null;
      }
      if (selected[0] != -1 && selected[1] != -1) {
        if (i != selected[0] && j != selected[1]) {
          // url = null;
        }
      }

      var cell = render('cell.html', {
        url: url,
        has_piece: (table[i][j] == 1),
        clickable: (selected[0] == -1 && selected[1] == -1 && table[i][j] == 1) || (selected[0] == i && selected[1] == j) || (selected[0] != -1 && selected[1] != -1 && table[i][j] == 2),
        selected: (selected[0] == i && selected[1] == j)
      });
      cells = cells + cell;
    }
  }
  res.render('main.html', {
    'cells': cells,
    'num_cols': table[0].length
  });
  // session.table = table;
});

var port = 3000;
app.listen(port, function() {
  console.log(`Escutando na porta ${port}...`);
})

/*
 * REFERENCIES
 * -----------
 * https://stackoverflow.com/questions/37901568/serving-static-files-in-express-with-mustache-templating
 */