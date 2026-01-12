import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import { Database } from "sqlite3"
import db from "../../src/db/db"
import ProductDAO from "../../src/dao/productDAO"
import { Category } from "../../src/components/product"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/db/db.ts")

let mockDBrun: any
let mockDBall: any
let mockDBget: any

const mockFoundProduct = {
    sellingPrice: 999, 
    model: 'iPhone 14', 
    category: Category.SMARTPHONE,
    arrivalDate: '2024-06-01',
    details: 'Latest model', 
    quantity: 10
}

const mockFoundMultipleProducts = [
    {
        sellingPrice: 999,
        model: 'iPhone 14',
        category: Category.SMARTPHONE,
        arrivalDate: '2024-06-01',
        details: 'Latest model',
        quantity: 10
    },
    {
        sellingPrice: 1300,
        model: 'Acer Predator Helios 300',
        category: Category.LAPTOP,
        arrivalDate: '2024-06-01',
        details: null,
        quantity: 0
    }
]

const err = new Error("DB error in get")

beforeAll(() => {
    mockDBrun = jest.spyOn(db, "run")
    mockDBall = jest.spyOn(db, "all")
    mockDBget = jest.spyOn(db, "get")
})

afterEach(() => {
    mockDBrun.mockRestore()
    mockDBall.mockRestore()
    mockDBget.mockRestore()
})

describe('ProductDAO Unit Test', () => {

    const productDAO = new ProductDAO()

    describe('registerProduct method', () => {

        test('It should register a new product successfully', async () => {
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, null)  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })

            const result = await productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01'
            )

            expect(result).toBe(true)
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['Microsoft Surface Pro 9'],
                expect.any(Function)
            )
            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [1199, 'Microsoft Surface Pro 9', Category.LAPTOP, '2024-06-01', 'Latest model', 3],
                expect.any(Function)
            )
        })

        test('It should throw an error if the product already exists', async () => {
            
            mockDBget.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockFoundProduct)
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })

            
            await expect(productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01'
            )).rejects.toThrow(ProductAlreadyExistsError)
            
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
            expect(mockDBrun).toHaveBeenCalledTimes(0)
        })

        test('DB error in get', async () => {
            
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01'
            )).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['Microsoft Surface Pro 9'],
                expect.any(Function)
            )
        })

        test('DB error in run', async () => {

            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, null)  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01'
            )).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['Microsoft Surface Pro 9'],
                expect.any(Function)
            )
            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [1199, 'Microsoft Surface Pro 9', Category.LAPTOP, '2024-06-01', 'Latest model', 3],
                expect.any(Function)
            )
        })

        test("It should reject with error when there is an exception (register user)", async () => {
            const error = new Error("Unexpected error");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.registerProduct('Microsoft Surface Pro 9',Category.LAPTOP,1199,'Latest model',3,'2024-06-01')).rejects.toThrow(error);
            mockDBGet.mockRestore();
        });

    })

    describe('increaseQuantity method', () => {

        test('It should increase the quantity of an existing product', async () => {
            
            mockDBget.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockFoundProduct)
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })

            await productDAO.increaseQuantity('iPhone 14', 5, '2024-06-01')

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [15, '2024-06-01', 'iPhone 14'],
                expect.any(Function)
            )
        })

        test('It should fail to increase quantity if product does not exist', async () => {
            
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, undefined) // Simula il ritorno di un prodotto non trovato
                return {} as Database
            })

            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })

            await expect(productDAO.increaseQuantity(
                'iPhone 16', 5, '2024-06-01')).rejects.toThrow(ProductNotFoundError)
        
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 16'],
                expect.any(Function)
            )

            expect(mockDBrun).not.toHaveBeenCalled()
        })

        test('DB error in get', async () => {
            
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.increaseQuantity('iPhone 14', 5, '2024-06-01')).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
        })

        test('DB error in run', async () => {

            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, mockFoundProduct)  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.increaseQuantity('iPhone 14', 5, '2024-06-01')).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [15, '2024-06-01', 'iPhone 14'],
                expect.any(Function)
            )
        })

        test("It should reject with error when there is an exception (increase quantity)", async () => {
            const error = new Error("Unexpected error");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.increaseQuantity('iPhone 14', 5, '2024-06-01')).rejects.toThrow(error);
            mockDBGet.mockRestore();
        });

    })

    describe('sellProduct method', () => {

        test('It should sell an existing product successfully', async () => {
            mockDBget.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockFoundProduct)
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })
    
            const newQuantity = await productDAO.sellProduct('iPhone 14', 5)
            expect(newQuantity).toBe(5)
    
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
    
            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [5, 'iPhone 14'],
                expect.any(Function)
            )
        })

        test('It should fail to sell a product that does not exist', async () => {
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, undefined)
                return {} as Database
            })
    
            await expect(productDAO.sellProduct('NonExistingProduct', 5))
                .rejects.toThrow(ProductNotFoundError)
    
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['NonExistingProduct'],
                expect.any(Function)
            )
            
            expect(mockDBrun).toHaveBeenCalledTimes(0)
        })

        test('It should fail to sell a product with zero quantity', async () => {
            mockDBget.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, { ...mockFoundProduct, quantity: 0 })
                return {} as Database
            })
    
            await expect(productDAO.sellProduct('iPhone 14', 1))
                .rejects.toThrow(EmptyProductStockError)
    
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(0)
        })
    
        test('It should fail to sell more quantity than available', async () => {
            mockDBget.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockFoundProduct)
                return {} as Database
            })
    
            await expect(productDAO.sellProduct('iPhone 14', 15))
                .rejects.toThrow(LowProductStockError)
    
                expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
            expect(mockDBrun).toHaveBeenCalledTimes(0)
        })

        test('DB error in get', async () => {
            
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.sellProduct('iPhone 14', 5)).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
        })

        test('DB error in run', async () => {

            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, mockFoundProduct)  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            const sellQuantity = 5

            await expect(productDAO.sellProduct('iPhone 14', sellQuantity)).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [mockFoundProduct.quantity - sellQuantity, 'iPhone 14'],
                expect.any(Function)
            )
        })

        test("It should reject with error when there is an exception (sell product)", async () => {
            const error = new Error("Unexpected error");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.sellProduct('iPhone 14', 5)).rejects.toThrow(error);
            mockDBGet.mockRestore();
        });
    })

    describe('getProducts method', () => {

        test('It should return an empty array if no products exist', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            const products = await productDAO.getProducts()
            expect(products).toEqual([])
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )
        })
    
        test('It should return all registered products', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockFoundMultipleProducts)
                return {} as Database
            })
    
            const products = await productDAO.getProducts()
            
            expect(products).toHaveLength(2)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate: '2024-06-01'
                    }),
                    expect.objectContaining({
                        model: 'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        sellingPrice: 1300,
                        details: null,
                        quantity: 0,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )
        })

        test('DB error in all', async () => {
            
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.getProducts()).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )
        })
    
        test("It should reject with error when there is an exception (get products)", async () => {
            const error = new Error("Unexpected error");
            const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.getProducts()).rejects.toThrow(error);
            mockDBAll.mockRestore();
        });
        
    })

    describe('getAvailableProducts method', () => {

        test('It should return an empty array if no products are available', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            const products = await productDAO.getAvailableProducts()
            expect(products).toEqual([])
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )
        })
    
        test('It should return only available products among those registered', async () => {
            
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundMultipleProducts[0]])
                return {} as Database
            })
    
            const products = await productDAO.getAvailableProducts()
    
            expect(products).toHaveLength(1)
    
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        sellingPrice: 999, 
                        model: 'iPhone 14', 
                        category: Category.SMARTPHONE,
                        arrivalDate: '2024-06-01',
                        details: 'Latest model', 
                        quantity: 10
                    })
                ])
            )
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )
        })

        test('DB error in all', async () => {
            
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.getAvailableProducts()).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )
        })

        test("It should reject with error when there is an exception (get available products)", async () => {
            const error = new Error("Unexpected error");
            const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.getAvailableProducts()).rejects.toThrow(error);
            mockDBAll.mockRestore();
        });
    })
    
    describe('getProductsByCategory method', () => {

        test('It should return an empty array if no products exist in the specified category', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            const products = await productDAO.getProductsByCategory(Category.SMARTPHONE)
            expect(products).toEqual([])
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [Category.SMARTPHONE],
                expect.any(Function)
            )
        })
    
        test('It should return only products of the specified category', async () => {

            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundMultipleProducts[0]])
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundMultipleProducts[1]])
                return {} as Database
            })
    
            const smartphoneProducts = await productDAO.getProductsByCategory(Category.SMARTPHONE)
    
            expect(smartphoneProducts).toHaveLength(1)
            expect(smartphoneProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )
    
            const laptopProducts = await productDAO.getProductsByCategory(Category.LAPTOP)
    
            expect(laptopProducts).toHaveLength(1)
            expect(laptopProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        sellingPrice: 1300,
                        details: null,
                        quantity: 0,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )

            expect(mockDBall).toHaveBeenCalledTimes(2)
            expect(mockDBall).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                [Category.SMARTPHONE],
                expect.any(Function)
            )
            expect(mockDBall).toHaveBeenNthCalledWith(
                2,
                expect.any(String),
                [Category.LAPTOP],
                expect.any(Function)
            )

        })
    
        test('It should handle invalid category', async () => {
            await expect(productDAO.getProductsByCategory('Vehicle')).rejects.toBeUndefined()
        })

        test('DB error in all', async () => {
            
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.getProductsByCategory(Category.LAPTOP)).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [Category.LAPTOP],
                expect.any(Function)
            )
        })
    
        test("It should reject with error when there is an exception (get products by category)", async () => {
            const error = new Error("Unexpected error");
            const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.getProductsByCategory(Category.SMARTPHONE)).rejects.toThrow(error);
            mockDBAll.mockRestore();
        });
    })
    
    describe('getAvailableProductsByCategory method', () => {

        test('It should return an empty array if no available products exist in the specified category', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            const products = await productDAO.getAvailableProductsByCategory(Category.APPLIANCE)
            expect(products).toEqual([])
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [Category.APPLIANCE],
                expect.any(Function)
            )
        })
    
        test('It should return only available products of the specified category', async () => {
    
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundMultipleProducts[0]])
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [{...mockFoundMultipleProducts[1], quantity: 5}])
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            const smartphoneProducts = await productDAO.getAvailableProductsByCategory(Category.SMARTPHONE)
    
            expect(smartphoneProducts).toHaveLength(1)
            expect(smartphoneProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )
    
            const laptopProducts = await productDAO.getAvailableProductsByCategory(Category.LAPTOP)
    
            expect(laptopProducts).toHaveLength(1)
            expect(laptopProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        sellingPrice: 1300,
                        model: 'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        arrivalDate: '2024-06-01',
                        details: null,
                        quantity: 5
                    })
                ])
            )
    
            const applianceProducts = await productDAO.getAvailableProductsByCategory(Category.APPLIANCE)
            expect(applianceProducts).toEqual([])
    
            expect(mockDBall).toHaveBeenCalledTimes(3)
            expect(mockDBall).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                [Category.SMARTPHONE],
                expect.any(Function)
            )
            expect(mockDBall).toHaveBeenNthCalledWith(
                2,
                expect.any(String),
                [Category.LAPTOP],
                expect.any(Function)
            )
            expect(mockDBall).toHaveBeenNthCalledWith(
                3,
                expect.any(String),
                [Category.APPLIANCE],
                expect.any(Function)
            )

    
        })
    
        test('It should handle invalid category', async () => {
            await expect(productDAO.getAvailableProductsByCategory('Camera')).rejects.toBeUndefined()
        })

        test('DB error in all', async () => {
            
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.getAvailableProductsByCategory(Category.SMARTPHONE)).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                [Category.SMARTPHONE],
                expect.any(Function)
            )
        })
    
        test("It should reject with error when there is an exception (get available products by category)", async () => {
            const error = new Error("Unexpected error");
            const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.getAvailableProductsByCategory(Category.APPLIANCE)).rejects.toThrow(error);
            mockDBAll.mockRestore();
        });
    })

    describe('getProductsByModel method', () => {

        test('It should return an array containing only the registered product', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundMultipleProducts[1]])
                return {} as Database
            })
    
            const result = await productDAO.getProductsByModel('Acer Predator Helios 300')
            
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        sellingPrice: 1300,
                        model: 'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        arrivalDate: '2024-06-01',
                        details: null,
                        quantity: 0
                    })
                ])
            )
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                ['Acer Predator Helios 300'],
                expect.any(Function)
            )
        })
    
        test('It should return an empty array if no products exist with the specified model', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            await expect(productDAO.getProductsByModel('NonExistentModel')).rejects.toThrow(ProductNotFoundError)
    
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                ['NonExistentModel'],
                expect.any(Function)
            )
        })

        test('DB error in all', async () => {
            
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.getProductsByModel('Acer Predator Helios 300')).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                ['Acer Predator Helios 300'],
                expect.any(Function)
            )
        })

        test("It should reject with error when there is an exception (get products by model)", async () => {
            const error = new Error("Unexpected error");
            const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.getProductsByModel('Acer Predator Helios 300')).rejects.toThrow(error);
            mockDBAll.mockRestore();
        });
    
    })
        
    describe('getAvailableProductsByModel method', () => {
    
        test('It should throw an error if the product does not exist', async () => {
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
            
            await expect(productDAO.getAvailableProductsByModel('iPhone 14')).rejects.toThrow(ProductNotFoundError)
            
            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
        })
    
        test('It should return an empty array of products for the given model if no products are available', async () => {
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundProduct])
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
    
            const products = await productDAO.getAvailableProductsByModel('iPhone 14')
    
            expect(products).toHaveLength(0)
            expect(products).toEqual([])
    
            expect(mockDBall).toHaveBeenCalledTimes(2)
            expect(mockDBall).toHaveBeenNthCalledWith(1, expect.any(String), ['iPhone 14'], expect.any(Function))
            expect(mockDBall).toHaveBeenNthCalledWith(2, expect.any(String), ['iPhone 14'], expect.any(Function))
        })
    
        test('It should return only available products for the given model', async () => {
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundProduct])
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundProduct])
                return {} as Database
            })
    
            const products = await productDAO.getAvailableProductsByModel('iPhone 14')
    
            expect(products).toHaveLength(1)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )
    
            expect(mockDBall).toHaveBeenCalledTimes(2)
            expect(mockDBall).toHaveBeenNthCalledWith(1, expect.any(String), ['iPhone 14'], expect.any(Function))
            expect(mockDBall).toHaveBeenNthCalledWith(2, expect.any(String), ['iPhone 14'], expect.any(Function))
        })

        test('DB error in all', async () => {
            
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.getAvailableProductsByModel('iPhone 14')).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(1)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            jest.clearAllMocks()

            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [mockFoundProduct])
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.getAvailableProductsByModel('iPhone 14')).rejects.toThrow(err)

            expect(mockDBall).toHaveBeenCalledTimes(2)
            expect(mockDBall).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

        })

        test("It should reject with error when there is an exception (get available products by model)", async () => {
            const error = new Error("Unexpected error");
            const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.getAvailableProductsByModel("iPhone 14")).rejects.toThrow(error);
            mockDBAll.mockRestore();
        });
    
    })
    
    describe('deleteProduct method', () => {

        test('It should delete an existing product successfully', async () => {
            
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, mockFoundProduct)
                return {} as Database
            })

            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            })

            const result = await productDAO.deleteProduct('iPhone 14')
            expect(result).toBe(true)
    
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenNthCalledWith(1, expect.any(String), ['iPhone 14'], expect.any(Function))

            expect(mockDBrun).toHaveBeenCalledTimes(3)
            expect(mockDBrun).toHaveBeenCalledWith(expect.any(String), ['iPhone 14'], expect.any(Function))
        })
    
        test("It should throw an error if the product does not exist", async () => {
            mockDBget.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, undefined)
                return {} as Database
            })
    
            await expect(productDAO.deleteProduct("iPhone 4000")).rejects.toThrow(ProductNotFoundError)
    
            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(expect.any(String), ['iPhone 4000'], expect.any(Function))

            expect(mockDBrun).toHaveBeenCalledTimes(0)
        })

        test('DB error in get', async () => {
            
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })

            await expect(productDAO.deleteProduct('iPhone 14')).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )
        })

        test('DB error in the first run', async () => {

            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, mockFoundProduct)  
                return {} as Database
            })
            mockDBrun.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.deleteProduct('iPhone 14')).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

        })

        test('DB error in the second run', async () => {
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, mockFoundProduct)  
                return {} as Database
            })
            mockDBrun.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.deleteProduct('iPhone 14')).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(2)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

        })

        test('DB error in the third run', async () => {
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, mockFoundProduct)  
                return {} as Database
            })
            mockDBrun.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.deleteProduct('iPhone 14')).rejects.toThrow(err)

            expect(mockDBget).toHaveBeenCalledTimes(1)
            expect(mockDBget).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

            expect(mockDBrun).toHaveBeenCalledTimes(3)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                ['iPhone 14'],
                expect.any(Function)
            )

        })

        test("It should reject with error when there is an exception (delete product)", async () => {
            const error = new Error("Unexpected error");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.deleteProduct("iPhone 14")).rejects.toThrow(error);
            mockDBGet.mockRestore();
        });
    
    })    

    describe('deleteProducts method', () => {

        test('It should delete all products successfully', async () => {
            
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            })
    
            const result = await productDAO.deleteProducts()
            expect(result).toBe(true)
    
            expect(mockDBrun).toHaveBeenCalledTimes(3)
            expect(mockDBrun).toHaveBeenCalledWith(expect.any(String), [], expect.any(Function))
        })

        test('DB error in the first run', async () => {
            mockDBrun.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.deleteProducts()).rejects.toThrow(err)

            expect(mockDBrun).toHaveBeenCalledTimes(1)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )

        })

        test('DB error in the second run', async () => {
            mockDBrun.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.deleteProducts()).rejects.toThrow(err)

            expect(mockDBrun).toHaveBeenCalledTimes(2)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )

        })

        test('DB error in the third run', async () => {
            mockDBrun.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, true)
                return {} as Database
            }).mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(err)
                return {} as Database
            })

            await expect(productDAO.deleteProducts()).rejects.toThrow(err)

            expect(mockDBrun).toHaveBeenCalledTimes(3)
            expect(mockDBrun).toHaveBeenCalledWith(
                expect.any(String),
                [],
                expect.any(Function)
            )

        })
    
        test("It should reject with error when there is an exception (delete products)", async () => {
            const error = new Error("Unexpected error");
            const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
                throw error;    // Simula un'eccezione
            });
    
            await expect(productDAO.deleteProducts()).rejects.toThrow(error);
            mockDBRun.mockRestore();
        });

    })
    

})