/* eslint-disable indent */
import Product from '~/models/product.model.js'
import Version from '~/models/version.model.js'
import { versionValid } from '~/validation/version.validation.js'

export const getAllVersions = async (req, res) => {
  try {
    const { page, limit, sort, order, search, price_range, ram, memory, screen, cpu, vga } = req.query
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      populate: {
        path: 'product',
        select: 'name images subcategory',
        populate: {
          path: 'subcategory',
          select: 'name category'
        }
      },
      sort: getSortOptions(sort, order)
    }

    const filter = {}
    // Lấy danh sách ID sản phẩm dựa trên từ khóa tìm kiếm
    const productIds = await getProductIds(search)
    if (productIds.length > 0) {
      filter['product'] = { $in: productIds }
    }
    // Áp dụng bộ lọc giá
    applyPriceRangeFilter(filter, price_range)
    // Áp dụng bộ lọc regex theo cấu hình
    applyRegexFilters(filter, ram, memory, screen, cpu, vga)

    const versions = await Version.paginate(filter, options)
    if (versions.totalDocs === 0) {
      return res.status(200).json({
        message: 'Không tìm thấy sản phẩm nào!',
        data: []
      })
    }

    return res.status(200).json({
      message: 'Lấy sản phẩm thành công!',
      data: versions
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

export const getAllVersionsByCategory = async (req, res) => {
  try {
    const { category } = req.params
    const { page, limit, sort, order, price_range, ram, memory, screen, cpu, vga } = req.query
    const versions = await Version.find().populate({
      path: 'product',
      populate: {
        path: 'subcategory',
        match: { category }
      }
    })
    const filteredVersions = versions.filter((version) => version.product && version.product.subcategory)

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      populate: {
        path: 'product',
        select: 'name images subcategory',
        populate: {
          path: 'subcategory',
          select: 'name category'
        }
      },
      sort: getSortOptions(sort, order)
    }

    const filter = {}
    // Áp dụng bộ lọc giá
    applyPriceRangeFilter(filter, price_range)
    // Áp dụng bộ lọc regex theo cấu hình
    applyRegexFilters(filter, ram, memory, screen, cpu, vga)

    const versionsByCategory = await Version.paginate(
      { product: { $in: filteredVersions.map((version) => version.product._id) }, ...filter },
      options
    )
    if (versionsByCategory.totalDocs === 0) {
      return res.status(200).json({
        message: 'Không tìm thấy sản phẩm nào!',
        data: []
      })
    }

    return res.status(200).json({
      message: 'Lấy sản phẩm thành công!',
      data: versionsByCategory
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

export const getAllVersionsBySubcategory = async (req, res) => {
  try {
    const { subcategory } = req.params
    const { page, limit, sort, order, price_range, ram, memory, screen, cpu, vga } = req.query
    const versions = await Version.find().populate({
      path: 'product',
      match: { subcategory }
    })
    const filteredVersions = versions.filter((version) => version.product && version.product.subcategory)

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      populate: {
        path: 'product',
        select: 'name images subcategory',
        populate: {
          path: 'subcategory',
          select: 'name category'
        }
      },
      sort: getSortOptions(sort, order)
    }

    const filter = {}
    // Áp dụng bộ lọc giá
    applyPriceRangeFilter(filter, price_range)
    // Áp dụng bộ lọc regex theo cấu hình
    applyRegexFilters(filter, ram, memory, screen, cpu, vga)

    const versionsBySubcategory = await Version.paginate(
      { product: { $in: filteredVersions.map((version) => version.product._id) }, ...filter },
      options
    )
    if (versionsBySubcategory.totalDocs === 0) {
      return res.status(200).json({
        message: 'Không tìm thấy sản phẩm nào!',
        data: []
      })
    }

    return res.status(200).json({
      message: 'Lấy sản phẩm thành công!',
      data: versionsBySubcategory
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

export const getVersionById = async (req, res) => {
  try {
    const version = await Version.findById(req.params.id).populate({
      path: 'product',
      select: 'name images subcategory',
      populate: {
        path: 'subcategory',
        select: 'name category'
      }
    })
    if (!version) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm này!' })
    }

    return res.status(200).json({
      message: 'Lấy sản phẩm thành công!',
      data: version
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

export const createVersion = async (req, res) => {
  try {
    const existedVersion = await Version.findOne({ name: req.body.name })
    if (existedVersion) {
      return res.status(400).json({ message: 'Sản phẩm này đã tồn tại!' })
    }

    const { error } = versionValid.validate(req.body, { abortEarly: false })
    if (error) {
      const errors = error.details.map((item) => item.message)
      return res.status(400).json({ errors })
    }

    const version = await Version.create(req.body)
    if (!version) {
      return res.status(400).json({ message: 'Tạo sản phẩm không thành công!' })
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      version.product,
      { $addToSet: { versions: version._id } },
      { new: true }
    )
    if (!updatedProduct) {
      return res.status(400).json({ message: 'Cập nhật sản phẩm không thành công!' })
    }

    return res.status(201).json({
      message: 'Tạo sản phẩm thành công!',
      data: version
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

export const updateVersion = async (req, res) => {
  try {
    const { error } = versionValid.validate(req.body, { abortEarly: false })
    if (error) {
      const errors = error.details.map((item) => item.message)
      return res.status(400).json({ errors })
    }

    const existedVersion = await Version.findOne({ name: req.body.name })
    if (existedVersion) {
      return res.status(400).json({ message: 'Sản phẩm này đã tồn tại!' })
    }

    const version = await Version.findById(req.params.id)
    if (!version) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm này!' })
    }

    if (req.body.product !== version.product) {
      const oldProduct = await Product.findByIdAndUpdate(version.product, { $pull: { versions: version._id } })
      if (!oldProduct) {
        return res.status(400).json({ message: 'Cập nhật sản phẩm không thành công!' })
      }

      const newProduct = await Product.findByIdAndUpdate(req.body.product, { $push: { versions: version._id } })
      if (!newProduct) {
        return res.status(400).json({ message: 'Cập nhật sản phẩm không thành công!' })
      }
    }

    const updatedVersion = await Version.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updatedVersion) {
      return res.status(400).json({ message: 'Cập nhật sản phẩm không thành công!' })
    }

    return res.status(200).json({
      message: 'Cập nhật sản phẩm thành công!',
      data: updatedVersion
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

export const deleteVersion = async (req, res) => {
  try {
    const version = await Version.findById(req.params.id)
    if (!version) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm này!' })
    }

    const deletedVersion = await Version.findByIdAndDelete(req.params.id)
    if (!deletedVersion) {
      return res.status(400).json({ message: 'Xóa sản phẩm không thành công!' })
    }

    const updatedProduct = await Product.findByIdAndUpdate(version.product, { $pull: { versions: version._id } })
    if (!updatedProduct) {
      return res.status(400).json({ message: 'Cập nhật sản phẩm không thành công!' })
    }

    return res.status(200).json({
      message: 'Xóa sản phẩm thành công!',
      data: deletedVersion
    })
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message
    })
  }
}

// Lọc sản phẩm theo giá và ngày tạo
const getSortOptions = (sort, order) => {
  const sortOptions = {}
  if (sort && order) {
    if (sort === 'createdAt') {
      sortOptions[sort] = order === 'new' ? -1 : 1
    } else if (sort === 'price') {
      sortOptions['current_price'] = order === 'asc' ? 1 : -1
    }
  }
  return sortOptions
}

// Lấy danh sách ID sản phẩm dựa trên từ khóa tìm kiếm
const getProductIds = async (search) => {
  if (!search) return []

  const products = await Product.find({
    name: { $regex: search, $options: 'i' }
  }).select('_id')

  return products.map((product) => product._id)
}

// Lọc sản phẩm theo khoảng giá
const applyPriceRangeFilter = (filter, price_range) => {
  if (price_range) {
    switch (price_range) {
      case 'under10':
        filter['current_price'] = { $lt: 10000000 }
        break
      case '10to20':
        filter['current_price'] = { $gte: 10000000, $lte: 20000000 }
        break
      case '20to40':
        filter['current_price'] = { $gte: 20000000, $lte: 40000000 }
        break
      case '40to60':
        filter['current_price'] = { $gte: 40000000, $lte: 60000000 }
        break
      case '60to80':
        filter['current_price'] = { $gte: 60000000, $lte: 80000000 }
        break
      case 'above80':
        filter['current_price'] = { $gte: 80000000 }
        break
      default:
        break
    }
  }
}

// Lọc sản phẩm theo cấu hình
const applyRegexFilters = (filter, ram, memory, screen, cpu, vga) => {
  const regexFilters = [
    { key: 'description', field: 'RAM', value: ram },
    { key: 'description', field: 'Ổ cứng', value: memory },
    { key: 'description', field: 'Màn hình', value: screen },
    { key: 'description', field: 'CPU', value: cpu },
    { key: 'description', field: 'VGA', value: vga }
  ]

  regexFilters.forEach(({ key, field, value }) => {
    if (value) {
      filter[key] = { $regex: `${field}: ${value}`, $options: 'i' }
    }
  })
}
