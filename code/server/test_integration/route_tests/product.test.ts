import request from 'supertest'
import { app } from '../../index'
import ProductDAO from '../../src/dao/productDAO'
import { Category } from '../../src/components/product'
import { cleanup } from '../../src/db/cleanup'
import { Role } from '../../src/components/user'
import seedController from '../../src/controllers/seeder'
import CartDAO from '../../src/dao/cartDAO'
import ReviewDAO from '../../src/dao/reviewDAO'
import { ProductNotFoundError } from '../../src/errors/productError'
import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, jest } from "@jest/globals"


jest.setTimeout(200000);
const baseURL = '/ezelectronics'
let customerCookie: string, managerCookie: string, adminCookie: string
const productDAO = new ProductDAO()

const newProduct = {
  model: 'Microsoft Surface Pro 9',
  category: Category.LAPTOP,
  sellingPrice: 1199,
  details: 'Windows 11',
  quantity: 5,
  arrivalDate: '2024-06-01'
}

async function createAndLoginCustomer() {
  await request(app).post(`${baseURL}/users`)
  .send({
      username: 'customer',
      password: 'customer123',
      name: 'Mer',
      surname: 'Custo',
      role: Role.CUSTOMER
  })

  const response = await request(app)
    .post(`${baseURL}/sessions`)
    .send({ username: 'customer', password: 'customer123'})

  customerCookie = response.headers['set-cookie']
}

async function createAndLoginManager() {
  await request(app).post(`${baseURL}/users`)
  .send({
      username: 'manager',
      password: 'manager123',
      name: 'Ger',
      surname: 'Mana',
      role: Role.MANAGER
  })

  const response = await request(app)
    .post(`${baseURL}/sessions`)
    .send({ username: 'manager', password: 'manager123'})

  managerCookie = response.headers['set-cookie']
}

async function createAndLoginAdmin() {
  await request(app).post(`${baseURL}/users`)
  .send({
      username: 'admin',
      password: 'admin123',
      name: 'Mina',
      surname: 'D',
      role: Role.ADMIN
  })

  const response = await request(app)
    .post(`${baseURL}/sessions`)
    .send({ username: 'admin', password: 'admin123'})

  adminCookie = response.headers['set-cookie']
}

describe('ProductRoutes integrated test', () => {

  beforeAll(async () => {
    await createAndLoginCustomer()
    await createAndLoginManager()
    await createAndLoginAdmin()
  })

  /*
  afterEach(async () => {
    productDAO.deleteProducts()
  })
  */

  /*afterAll(() => {
      cleanup()
  })
  */
  
  describe('POST /products', () => {

    test('It should register a new product by a Manager', async () => {
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(200)

      const products = await productDAO.getProductsByModel(newProduct.model)
      expect(products).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
              model: 'Microsoft Surface Pro 9',
              category: Category.LAPTOP,
              sellingPrice: 1199,
              details: 'Windows 11',
              quantity: 5,
              arrivalDate: '2024-06-01'
            })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should register a new product by an Admin', async () => {

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', adminCookie)
        .send(newProduct)
  
      expect(response.status).toBe(200)

      const products = await productDAO.getProductsByModel(newProduct.model)
      expect(products).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
              model: 'Microsoft Surface Pro 9',
              category: Category.LAPTOP,
              sellingPrice: 1199,
              details: 'Windows 11',
              quantity: 5,
              arrivalDate: '2024-06-01'
            })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return 401 for customer trying to register a product', async () => {
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', customerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })

    test('It should return 401 for a generic user trying to register a product', async () => {
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .send(newProduct)
  
      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })
      
    test('It should return 409 if model already exists', async () => {

      await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie) 
        .send(newProduct)

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)

      expect(response.status).toBe(409)

      productDAO.deleteProducts()
    })

    test('It should return 422 for an invalid category', async () => {
      const newProduct = {
        model: 'Microsoft Surface Pro 9',
        category: 'InvalidCategory',
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 5,
        arrivalDate: '2024-06-01'
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 for an empty model', async () => {
      const newProduct = {
        model: '',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 5,
        arrivalDate: '2024-06-01'
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 for a quantity less than or equal to 0', async () => {
      const newProduct = {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 0,
        arrivalDate: '2024-06-01'
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 for a selling price less than or equal to 0', async () => {
      const newProduct = {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 0,
        details: 'Windows 11',
        quantity: 5,
        arrivalDate: '2024-06-01'
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 for an empty arrivalDate', async () => {
      const newProduct = {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 5,
        arrivalDate: ''
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if arrivalDate is after the current date', async () => {
      const newProduct = {
        model: 'iPhone 13',
        category: Category.SMARTPHONE,
        quantity: 5,
        details: 'Windows 11',
        sellingPrice: 1199,
        arrivalDate: '2025-01-01',
      }

      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)

      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should use current date as arrivalDate when arrivalDate is missing', async () => {
      const newProduct = {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 5
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(200)
      const products = await productDAO.getProductsByModel(newProduct.model)
      expect(products[0].arrivalDate).toBe(new Date().toISOString().split('T')[0])

      productDAO.deleteProducts()
    })

    test('It should return 422 for an invalid arrivalDate format', async () => {
      const newProduct = {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 5,
        arrivalDate: '01-01-2024'
      }
  
      const response = await request(app)
        .post(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .send(newProduct)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

  })

  describe('PATCH /products/:model', () => {

    /*
    beforeEach(async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
    })

    */

    test('It should increase product quantity with a request made by a Manager', async () => {

      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )

      const update = { quantity: 3 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity + update.quantity)

      productDAO.deleteProducts()
    })

    test('It should increase product quantity with a request made by an Admin', async () => {

      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )

      const update = { quantity: 3 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity + update.quantity)

      productDAO.deleteProducts()
    })

    test('It should return 401 for customer trying to increase product quantity', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = { quantity: 3 }
  
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', customerCookie)
        .send(update)
  
      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })
  
    test('It should return 404 if product model does not exist', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = { quantity: 3 }
  
      const response = await request(app)
        .patch(`${baseURL}/products/Microsoft Surface Pro 8`)
        .set('Cookie', managerCookie)
        .send(update)
  
      expect(response.status).toBe(404)

      productDAO.deleteProducts()
    })

    test('It should return 422 if quantity is missing in update', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = {}
    
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)
    
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  
    test('It should return 422 if quantity is less than or equal to 0', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = { quantity: 0 }
  
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  
    test('It should return a 422 error if changeDate is before the product\'s arrivalDate', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = {
        quantity: 3,
        changeDate: '2024-01-01'
      }
    
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', adminCookie)
        .send(update)
    
      expect(response.status).toBe(400)

      productDAO.deleteProducts()
    })

    test('It should return 422 if changeDate is after the current date', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = {
        quantity: 3,
        changeDate: '2025-01-01'
      }
  
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  
    test('It should use current date as changeDate when changeDate is missing', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = { quantity: 3 }
  
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)
  
      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].arrivalDate).toBe(new Date().toISOString().split('T')[0])

      productDAO.deleteProducts()
    })
  
    test('It should return 422 for an invalid changeDate format', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const update = {
        quantity: 3,
        changeDate: '01-01-2024'
      }
  
      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}`)
        .set('Cookie', managerCookie)
        .send(update)
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

  })

  describe('PATCH /products/:model/sell', () => {

    /*
    beforeEach(async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
    })
    */

    test('It should reduce product quantity with a request made by a Manager', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', managerCookie)
        .send(sellBody)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity - sellBody.quantity)

      productDAO.deleteProducts()
    })

    test('It should reduce product quantity with a request made by an Admin', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', adminCookie)
        .send(sellBody)

      expect(response.status).toBe(200)
      const updatedProduct = await productDAO.getProductsByModel(newProduct.model)
      expect(updatedProduct[0].quantity).toBe(newProduct.quantity - sellBody.quantity)

      productDAO.deleteProducts()
    })

    test('It should return 401 for a Customer trying to reduce product quantity', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', customerCookie)
        .send(sellBody)

      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })

    test('It should return 404 if product model does not exist', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/NonExistentModel/sell`)
        .set('Cookie', managerCookie)
        .send(sellBody)

      expect(response.status).toBe(404)

      productDAO.deleteProducts()
    })

    test('It should return 409 if available quantity is 0', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      await productDAO.sellProduct(newProduct.model, 5)

      const sellBody = { quantity: 2 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', managerCookie)
        .send(sellBody)

      expect(response.status).toBe(409)

      productDAO.deleteProducts()
    })

    test('It should return 409 if requested quantity is greater than available quantity', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: 7 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', managerCookie)
        .send(sellBody)

      expect(response.status).toBe(409)

      productDAO.deleteProducts()
    })

    test('It should return 422 if quantity is equal to 0', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: 0 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', managerCookie)
        .send(sellBody)

      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if quantity is a negative number', async () => {
      await productDAO.registerProduct(
        newProduct.model,
        newProduct.category,
        newProduct.sellingPrice,
        newProduct.details,
        newProduct.quantity,
        newProduct.arrivalDate
      )
      
      const sellBody = { quantity: -3 }

      const response = await request(app)
        .patch(`${baseURL}/products/${newProduct.model}/sell`)
        .set('Cookie', managerCookie)
        .send(sellBody)

      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  })

  describe('GET /products', () => {
  
    /*
    beforeEach(async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
    })
    */

    test('It should return all products for a Manager', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(4)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' }),
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro' }),
          expect.objectContaining({ model: 'Acer Predator Helios 300' }),
          expect.objectContaining({ model: 'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return all products for an Admin', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', adminCookie)
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(4)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' }),
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro' }),
          expect.objectContaining({ model: 'Acer Predator Helios 300' }),
          expect.objectContaining({ model: 'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return 401 for a Customer', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', customerCookie)
  
      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })

    test('It should return 401 for a generic user', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
  
      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })

    test('It should return products filtered by category', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'category', category: Category.SMARTPHONE })
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro'})
        ])
      )

      response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'category', category: Category.LAPTOP })
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(2)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' }),
          expect.objectContaining({ model: 'Acer Predator Helios 300' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return products filtered by model', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'model', model: 'Microsoft Surface Pro 9' })
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is null and any of category or model is not null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: null, category: Category.SMARTPHONE })
  
      expect(response.status).toBe(422)

      response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: null, model: 'Microsoft Surface Pro 9' })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is category and category is null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'category', category: null })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is category and model is not null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'category', category: Category.SMARTPHONE, model: 'Xiaomi Redmi Note 9 Pro' })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is model and model is null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'model', model: null })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is model and category is not null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'model', model: 'Xiaomi Redmi Note 9 Pro', category: Category.SMARTPHONE })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is not among null, category or model', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'price' })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is undefined while category or model are not', async () => {
      let response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ category: Category.SMARTPHONE })
      
      expect(response.status).toBe(422)

      response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ model: 'Xiaomi Redmi Note 9 Pro' })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 404 if model does not represent a product in the database', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)
        .query({ grouping: 'model', model: 'NonExistentModel' })
  
      expect(response.status).toBe(404)

      productDAO.deleteProducts()
    })

  })

  describe('GET /products/available', () => {
  
    /*
    beforeEach(async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
    })
    */

    test('It should return all available products for a Customer', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(4)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' }),
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro' }),
          expect.objectContaining({ model: 'Acer Predator Helios 300' }),
          expect.objectContaining({ model: 'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return all available products for a Manager', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', managerCookie)
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(4)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' }),
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro' }),
          expect.objectContaining({ model: 'Acer Predator Helios 300' }),
          expect.objectContaining({ model: 'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return all available products for an Admin', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', adminCookie)
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(4)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Microsoft Surface Pro 9' }),
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro' }),
          expect.objectContaining({ model: 'Acer Predator Helios 300' }),
          expect.objectContaining({ model: 'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return 401 for a non-logged in user', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app).get(`${baseURL}/products/available`)
  
      expect(response.status).toBe(401)

      productDAO.deleteProducts()
    })
  
    test('It should return available products filtered by category', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'category', category: Category.SMARTPHONE })
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Xiaomi Redmi Note 9 Pro' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return available products filtered by model', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'model', model: 'Acer Predator Helios 300' })
  
      expect(response.status).toBe(200)
      expect(response.body.length).toBe(1)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ model: 'Acer Predator Helios 300' })
        ])
      )

      productDAO.deleteProducts()
    })

    test('It should return 422 if grouping is null and any of category or model is not null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      let response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: null, category: Category.SMARTPHONE })
  
      expect(response.status).toBe(422)

      response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: null, model: 'Acer Predator Helios 300' })
  
      expect(response.status).toBe(422)
      
      productDAO.deleteProducts()
    })
  
    test('It should return 422 if grouping is category and category is null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'category', category: null })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  
    test('It should return 422 if grouping is category and model is not null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'category', category: Category.SMARTPHONE, model: 'Xiaomi Redmi Note 9 Pro' })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  
    test('It should return 422 if grouping is model and model is null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'model', model: null })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })
  
    test('It should return 422 if grouping is model and category is not null', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'model', model: 'Xiaomi Redmi Note 9 Pro', category: Category.SMARTPHONE })
  
      expect(response.status).toBe(422)

      productDAO.deleteProducts()
    })

    test('It should return 404 if model does not represent a product in the database', async () => {
      await productDAO.registerProduct(
        'Microsoft Surface Pro 9',
        Category.LAPTOP,
        1199,
        'Windows 11',
        5,
        '2024-06-01'
      )

      await productDAO.registerProduct(
        'Xiaomi Redmi Note 9 Pro',
        Category.SMARTPHONE,
        220,
        '2020 smartphone',
        7,
        '2024-06-05'
      )

      await productDAO.registerProduct(
        'Acer Predator Helios 300',
        Category.LAPTOP,
        1299,
        '2016 laptop',
        3,
        '2024-06-04'
      )

      await productDAO.registerProduct(
        'Lavatrice BESPOKE AI™ Ecodosatore 11Kg WW11BB744DGB',
        Category.APPLIANCE,
        729,
        `Scopri un nuovo livello di comodità grazie all\'intelligenza artificiale, 
        che personalizza il lavaggio ricordando le tue abitudini, suggerendoti i programmi più indicati 
        e visualizzando le informazioni giuste quando servono.`,
        4,
        '2024-06-08'
      )
      
      const response = await request(app)
        .get(`${baseURL}/products/available`)
        .set('Cookie', customerCookie)
        .query({ grouping: 'model', model: 'NonExistentModel' })
  
      expect(response.status).toBe(404)

      productDAO.deleteProducts()
    })
    
  })

  describe('DELETE /products/:model', () => {

    const seeder = new seedController()

    /*
    beforeEach(async () => {
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
    })

    afterEach(async () => {
      await cleanup()
    })
    */

    test('It should delete a product and its related entities if the request is made by a Manager', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      let response = await request(app)
        .delete(`${baseURL}/products/Samsung v11`)
        .set('Cookie', managerCookie)
  
      expect(response.status).toBe(200)
  
      response = await request(app)
        .get(`${baseURL}/products/Samsung v11`)
        .set('Cookie', managerCookie)

      expect(response.status).toBe(404)

      const allCarts = await new CartDAO().getAllCarts()

      allCarts.forEach(cart => 
        cart.products.forEach(product => 
          expect(product.model).not.toBe('Samsung v11')
        ))
        
      await expect(new ReviewDAO().getReviews('Samsung v11')).rejects.toThrow(ProductNotFoundError)

    })

    test('It should delete a product and its related entities if the request is made by an Admin', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      let response = await request(app)
        .delete(`${baseURL}/products/Samsung v11`)
        .set('Cookie', adminCookie)
  
      expect(response.status).toBe(200)
  
      response = await request(app)
        .get(`${baseURL}/products/Samsung v11`)
        .set('Cookie', adminCookie)

      expect(response.status).toBe(404)

      const allCarts = await new CartDAO().getAllCarts()

      allCarts.forEach(cart => 
        cart.products.forEach(product => 
          expect(product.model).not.toBe('Samsung v11')
        ))
        
      await expect(new ReviewDAO().getReviews('Samsung v11')).rejects.toThrow(ProductNotFoundError)

    })

    test('It should return 401 if the request is made by a Customer', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const response = await request(app)
        .delete(`${baseURL}/products/Microsoft Surface Pro 9`)
        .set('Cookie', customerCookie)
  
      expect(response.status).toBe(401)

    })

    test('It should return 401 if the request is made by a non authenticated user', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const response = await request(app)
        .delete(`${baseURL}/products/Microsoft Surface Pro 9`)
  
      expect(response.status).toBe(401)

    })

    test('It should return 404 if the product does not exist in the database', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const response = await request(app)
        .delete(`${baseURL}/products/NonExistentModel`)
        .set('Cookie', adminCookie)
  
      expect(response.status).toBe(404)

    })

  })

  describe('DELETE /products', () => {

    const seeder = new seedController()
    const reviewDAO = new ReviewDAO()

    /*
    beforeEach(async () => {
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
    })

    afterEach(async () => {
      await cleanup()
    })
    */

    test('It should delete all products and their related entities if the request is made by a Manager', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const allProducts = await productDAO.getProducts()
      
      let response = await request(app)
        .delete(`${baseURL}/products`)
        .set('Cookie', managerCookie)
  
      expect(response.status).toBe(200)
  
      response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', managerCookie)

      expect(response.body).toEqual([])

      const allCarts = await new CartDAO().getAllCarts()

      allCarts.forEach(cart => 
        expect(cart.products).toEqual([])
      )

      allProducts.forEach(async (product: { model: string }) => 
        await expect(reviewDAO.getReviews(product.model)).rejects.toThrow(ProductNotFoundError)
      )

    })

    test('It should delete all products and their related entities if the request is made by an Admin', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const allProducts = await productDAO.getProducts()
      
      let response = await request(app)
        .delete(`${baseURL}/products`)
        .set('Cookie', adminCookie)
  
      expect(response.status).toBe(200)
  
      response = await request(app)
        .get(`${baseURL}/products`)
        .set('Cookie', adminCookie)

      expect(response.body).toEqual([])

      const allCarts = await new CartDAO().getAllCarts()

      allCarts.forEach(cart => 
        expect(cart.products).toEqual([])
      )

      allProducts.forEach(async (product: { model: string }) => 
        await expect(reviewDAO.getReviews(product.model)).rejects.toThrow(ProductNotFoundError)
      )

    })

    test('It should return 401 all products if the request is made by a Customer', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const response = await request(app)
        .delete(`${baseURL}/products`)
        .set('Cookie', customerCookie)
  
      expect(response.status).toBe(401)

    })

    test('It should return 401 if the request is made by a non authenticated user', async () => {
      await cleanup()
      await seeder.seedDatabase()
      await createAndLoginCustomer()
      await createAndLoginManager()
      await createAndLoginAdmin()
      
      const response = await request(app)
        .delete(`${baseURL}/products`)
  
      expect(response.status).toBe(401)

    })

  })

})