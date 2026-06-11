const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const taskController = require('../controllers/taskController');

router.use(auth);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:id', taskController.updateTasks);
router.delete('/:id', taskController.deleteTask);

module.exports = router;

