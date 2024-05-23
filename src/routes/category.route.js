import { Router } from 'express'
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory
} from '~/controllers/category.controller.js'
import { checkPermission } from '~/middlewares/checkPermission.js'

const routerCategory = Router()

routerCategory.get('/', getAllCategories)
routerCategory.get('/:id', getCategoryById)
routerCategory.post('/', checkPermission('admin', 'member'), createCategory)
routerCategory.put('/:id', checkPermission('admin', 'member'), updateCategory)
routerCategory.delete('/:id', checkPermission('admin', 'member'), deleteCategory)

export default routerCategory
