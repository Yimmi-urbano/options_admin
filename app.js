const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

mongoose.connect('mongodb+srv://data_user:wY1v50t8fX4lMA85@cluster0.entyyeb.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
  console.log('Conexión exitosa a MongoDB');
});

const submenuSchema = new mongoose.Schema({
  optionID: String,
  title: String,
  url_page: String,
  icono: String,
  estado: String
});

const optionSchema = new mongoose.Schema({
  optionID: String,
  title: String,
  estado: String,
  url_page: String,
  icono: String,
  submenu: [submenuSchema],
});

const menuSchema = new mongoose.Schema({
  userID: String,
  company: String,
  options: {
    menu_panel: [optionSchema],
    menu_footer: [optionSchema],
  },
});

const Menu = mongoose.model('Menu', menuSchema);

app.use(express.json());

app.post('/options', async (req, res) => {
  try {
    const { userID, company, options } = req.body;
    const menu = new Menu({ userID, company, options });
    await menu.save();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la opción del menú' });
  }
});

app.get('/options/:userID', async (req, res) => {
  try {
    const { userID } = req.params;
    const menu = await Menu.findOne({ userID });

    if (!menu) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(menu.options);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las opciones del menú' });
  }
});


app.post('/options/:userID/:menuType', async (req, res) => {
  try {
    const { userID, menuType } = req.params;
    const { optionID, title, estado,icono,url_page, submenu } = req.body;
    const menu = await Menu.findOne({ userID });

    if (!menu) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingOption = menu.options[menuType].find((o) => o.optionID === optionID);

    if (existingOption) {
    
      existingOption.title = title;
      existingOption.estado = estado;
      existingOption.icono = icono;
      existingOption.url_page = url_page;
      existingOption.submenu = submenu;
    } else {
   
      const newOption = { optionID, title, estado ,icono,url_page, submenu };
      menu.options[menuType].push(newOption);
    }

    await menu.save();

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar o actualizar una opción en el menú' });
  }
});


app.post('/options/:userID/:menuType/:optionID', async (req, res) => {
  try {
    const { userID, menuType, optionID } = req.params;
    const { title, estado } = req.body;
    const menu = await Menu.findOne({ userID });

    if (!menu) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const option = menu.options[menuType].find((o) => o.optionID === optionID);

    if (!option) {
      return res.status(404).json({ error: 'Opción no encontrada' });
    }

    option.submenu.push({ title, estado });
    await menu.save();

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar un submenú' });
  }
});

app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
