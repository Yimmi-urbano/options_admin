const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

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
  url: String,
  componentURL: String,
  icono: String,
  estado: String,
  orden: Number
});

const optionSchema = new mongoose.Schema({
  optionID: String,
  title: String,
  estado: String,
  url: String,
  componentURL: String,
  icono: String,
  orden: Number,
  submenu: [submenuSchema],
});

const menuSchema = new mongoose.Schema({
  userID: String,
  companyType: String,
  companyID: String,
  domain: String,
  options: {
    menu_panel: [optionSchema],
    menu_footer: [optionSchema]
  },
});

const Menu = mongoose.model('Menu', menuSchema);

app.use(express.json());
app.use(cors());

app.post('/options', async (req, res) => {
  try {
    const { userID, company, options, companyID, domain } = req.body;
    const existingMenu = await Menu.findOne({ userID });
    if (existingMenu) {
      return res.status(400).json({ error: 'El userID ya existe en la colección' });
    }
    const menu = new Menu({ userID, company, options, companyID, domain });
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
    const { optionID, title, estado, icono, url, submenu, orden, componentURL } = req.body;
    const menu = await Menu.findOne({ userID });

    if (!menu) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingOption = menu.options[menuType].find((o) => o.optionID === optionID);

    if (existingOption) {

      if (title !== undefined) existingOption.title = title;
      if (estado !== undefined) existingOption.estado = estado;
      if (icono !== undefined) existingOption.icono = icono;
      if (url !== undefined) existingOption.url = url;
      if (submenu !== undefined) existingOption.submenu = submenu;
      if (orden !== undefined) existingOption.orden = orden;
      if (componentURL !== undefined) existingOption.componentURL = componentURL;
    } else {
      const newOption = {
        optionID,
        title,
        estado,
        icono,
        url,
        submenu,
        orden,
        componentURL,
      };
      menu.options[menuType].push(newOption);
    }

    await menu.save();

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar o actualizar una opción en el menú' });
  }
});

app.put('/options/:userID/:menuType/:optionID', async (req, res) => {
  try {
    const { userID, menuType, optionID } = req.params;
    const { optionID: submenuOptionID, title, estado, icono, url, orden, componentURL } = req.body;

    const menu = await Menu.findOne({ userID });

    if (!menu) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const option = menu.options[menuType].find((o) => o.optionID === optionID);

    if (!option) {
      return res.status(404).json({ error: 'Opción no encontrada' });
    }

    if (option.submenu && option.submenu.length > 0) {
      const submenuEntry = option.submenu.find((sub) => sub.optionID === submenuOptionID);

      if (submenuEntry) {

        submenuEntry.optionID = submenuOptionID;
        submenuEntry.title = title;
        submenuEntry.estado = estado;
        submenuEntry.icono = icono;
        submenuEntry.url = url;
        submenuEntry.orden = orden;
        submenuEntry.componentURL = componentURL;

      } else {

        const newSubmenuEntry = {
          optionID: submenuOptionID,
          title,
          estado,
          icono,
          url,
          orden,
          componentURL,
        };
        option.submenu.push(newSubmenuEntry);
      }
    } else {

      option.submenu = [{
        optionID: submenuOptionID,
        title,
        estado,
        icono,
        url,
        orden,
        componentURL,
      }];
    }

    await menu.save();

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar o actualizar el submenú' });
  }
});

app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
