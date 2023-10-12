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
  company: String,
  options: {
    menu_panel: [optionSchema],
    menu_footer: [optionSchema],
  },
});

const Menu = mongoose.model('Menu', menuSchema);

app.use(express.json());
app.use(cors());

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


app.put('/options/:userID/:menuType/:optionID', async (req, res) => {
  try {
    const { userID, menuType, optionID } = req.params;
    const { title, estado, icono, url, submenu, orden, componentURL } = req.body;
    const menu = await Menu.findOne({ userID });

    if (!menu) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingOption = menu.options[menuType].find((o) => o.optionID === optionID);

    if (existingOption) {
      // Actualiza los campos del recurso existente
      existingOption.title = title;
      existingOption.estado = estado;
      existingOption.icono = icono;
      existingOption.url = url;
      existingOption.submenu = submenu;
      existingOption.orden = orden;
      existingOption.componentURL = componentURL;
    } else {
      return res.status(404).json({ error: 'Opción de menú no encontrada' });
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
        // Si el submenuOptionID existe, actualiza sus propiedades
        submenuEntry.title = title;
        submenuEntry.estado = estado;
        submenuEntry.icono = icono;
        submenuEntry.url = url;
        submenuEntry.orden = orden;
        submenuEntry.componentURL = componentURL;
      } else {
        // Si el submenuOptionID no existe, crea un nuevo submenú
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
      // Si no hay submenú, crea uno nuevo
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
