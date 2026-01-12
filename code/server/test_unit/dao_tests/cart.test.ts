import CartDAO from '../../src/dao/cartDAO';
import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import db from '../../src/db/db';
import { Category } from '../../src/components/product';
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import { Cart, ProductInCart } from "../../src/components/cart"
import {User, Role} from "../../src/components/user"
import dayjs from "dayjs";
import { Database } from "sqlite3"

jest.mock("../../src/db/db.ts")
let mockDBrun: any
let mockDBall: any
let mockDBget: any

describe("CartDAO unit test", ()=>{

    const cartDAO = new CartDAO();



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
const emptyCart = {
    customer: "riccardoo",
    paid: false, 
    paymentDate: null as any,
    total: 0,
    products: [] as any
}
const samsungProduct = {
    sellingPrice: 500,
    model: "Samsung s20",
    category: Category.SMARTPHONE,
    arrivalDate: "2024-01-01",
    details: "bel telefono",
    quantity: 100,
}
const samsungProductQuantityZero = {
    sellingPrice: 500,
    model: "Samsung s20",
    category: Category.SMARTPHONE,
    arrivalDate: "2024-01-01",
    details: "bel telefono",
    quantity: 0,
}
const samsungCart = {
    customer: "riccardoo",
    paid: false, 
    paymentDate: null as any,
    total: 500,
    products: [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)],
    id: 0
}
const samsungCartPayed = [{
    customer: "riccardoo",
    paid: true, 
    paymentDate: "2024-01-01",
    total: 500,
    products: [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)]
}]
const samsungProductInCart = [{
    category: Category.SMARTPHONE,
    model: "Samsung s20",
    sellingPrice: 500,
    quantity: 1,
}]
    describe("getCurrentCart method", ()=>{

        test("It should retreive the empty current cart succesfully", async()=>{
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
            const result = await cartDAO.getCurrentCart("riccardoo");
            expect(result).toEqual(new Cart("riccardoo", false, null as any, 0, []))
        })
    
        test("It should retreive a cart with a product inside", async()=>{
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null, samsungCart)  
                return {} as Database
            })
            mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, samsungProductInCart)
                return {} as Database
            })
            const result = await cartDAO.getCurrentCart("riccardoo");
            expect(result).toEqual(new Cart("riccardoo", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)]))

        })
    

        test("internal DB error", async()=>{
            const err = new Error("DB error")
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.getCurrentCart("riccardoo")).rejects.toThrow(err)
   
        })
    
    })

    describe("addProductToCart method", ()=>{

        test("it should add a product to the cart succesfully", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungProduct)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {quantity: 100})  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })
            const check = await cartDAO.addProductToCart("riccardoo", "Samsung s20");
            expect(check).toBe(true);

        })
    

        test("try to add a non existing product", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, undefined)  
                return {} as Database
            })
            await expect(cartDAO.addProductToCart("riccardoo", "non existing product")).rejects.toThrow(ProductNotFoundError)

        })
    
        test("try to add a product with quantity == 0", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungProductQuantityZero)  
                return {} as Database
            })
            await expect(cartDAO.addProductToCart("riccardoo", "MSI v10")).rejects.toThrow(EmptyProductStockError)

        })

    
        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.addProductToCart("riccardoo", "Samsung s20")).rejects.toThrow(err)

        })
    
        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungProduct)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {quantity: 100})  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.addProductToCart("riccardoo", "Samsung s20")).rejects.toThrow(err)

        })
    
    

        test ("it should add two products to the cart succesfully", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungProduct)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {quantity: 100})  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null)
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, emptyCart)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungProduct)  
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {quantity: 100})  
                return {} as Database
            })
            let check = await cartDAO.addProductToCart("riccardoo", "Samsung s20");
            expect(check).toBe(true);
            check = await cartDAO.addProductToCart("riccardoo", "Samsung s20");
            expect(check).toBe(true);

        })
    })

    describe("payCurrentCart method", ()=>{
        
        test("it should pay the cart correctly and reduce the quantity of product in stock", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungCart)  
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, samsungProductInCart)
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {pcq: 1, pq: 2})  
                return {} as Database
            })
            mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
                callback(null)  
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
            const result = await cartDAO.payCurrentCart("riccardoo", new Date().toISOString().split("T")[0])
            expect(result).toBe(true);

        })
    

        test("product quantity in stock == 0", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungCart)  
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, samsungProductInCart)
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {pcq: 1, pq: 0})  
                return {} as Database
            })

            await expect(cartDAO.payCurrentCart("riccardoo", dayjs().format("TTTT-MM-DD"))).rejects.toThrow(EmptyProductStockError)

        })
    
        test("product quantity in stock < product quantity in cart", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungCart)  
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, samsungProductInCart)
                return {} as Database
            })
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, {pcq: 2, pq: 1})  
                return {} as Database
            })

            await expect(cartDAO.payCurrentCart("riccardoo", dayjs().format("TTTT-MM-DD"))).rejects.toThrow(LowProductStockError)
  
        })
    
        test ("try to pay a non existing cart", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, undefined)  
                return {} as Database
            })
            await expect(cartDAO.payCurrentCart("riccardoo", new Date().toISOString().split("T")[0])).rejects.toThrow(CartNotFoundError)

        })
    
        test("try to pay an empty cart", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
                callback(null, samsungCart)  
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
            await expect(cartDAO.payCurrentCart("riccardoo", new Date().toISOString().split("T")[0])).rejects.toThrow(EmptyCartError)

        })
   
        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.payCurrentCart("riccardoo", dayjs().format("YYYY-MM-DD"))).rejects.toThrow(err)

        })
    
        
    })

    describe("getHistoryCart method", ()=>{

        test("should succesfully return an array of payed carts", async()=>{
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, samsungCartPayed)
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [{model: "Samsung s20", quantity: 1, category: Category.SMARTPHONE, sellingPrice: 500}])
                return {} as Database
            })
            const finalResult = await cartDAO.getHistoryCart("riccardoo");
            expect(finalResult).toEqual([new Cart("riccardoo", true, "2024-01-01", 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])])

        })
    

        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.getHistoryCart("riccardoo")).rejects.toThrow(err)

        })
    
        test("user has not any cart in history", async()=>{
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
            const finalResult = await cartDAO.getHistoryCart("riccardoo");
            expect(finalResult).toEqual([]);

        })
    
    })

    describe("deleteProductFromCart method", ()=>{

        test("delete successfully the product when quantity is == 1", async () => {
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { id: 1, customer: "riccardoo", paid: false, total: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { sellingPrice: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { model: "Samsung s20", quantity: 1, price: 500 });
                return {} as Database;
            });
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null);
                return {} as Database;
            });
        
            const check = await cartDAO.deleteProductFromCart("riccardoo", "Samsung s20");
            expect(check).toBe(true);
        });
    
        test("try to remove a product from a non existing cart", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, undefined);
                return {} as Database;
            });

            await expect(cartDAO.deleteProductFromCart("riccardoo", "Samsung s20")).rejects.toThrow(CartNotFoundError)

        })
    
        test("try to remove a not existing product", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { id: 1, customer: "riccardoo", paid: false, total: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, undefined);
                return {} as Database;
            });
            await expect(cartDAO.deleteProductFromCart("riccardoo", "non existing product")).rejects.toThrow(ProductNotFoundError)

        })
    
        test("try to remove a prodact that is not in the cart", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { id: 1, customer: "riccardoo", paid: false, total: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { sellingPrice: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, undefined);
                return {} as Database;
            });
            await expect(cartDAO.deleteProductFromCart("riccardoo", "Iphone X")).rejects.toThrow(ProductNotInCartError)

        })
    
        test("decrease the quantity of a product in cart when quantity is > 1", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { id: 1, customer: "riccardoo", paid: false, total: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { sellingPrice: 500 });
                return {} as Database;
            });
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { model: "Samsung s20", quantity: 2, price: 500 });
                return {} as Database;
            });
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null);
                return {} as Database;
            });
            const check = await cartDAO.deleteProductFromCart("riccardoo", "Samsung s20");
            expect(check).toBe(true);

        })
    
        test("internal DB error", async()=>{

            const err = new Error("DB error")
            jest.spyOn(db, "get").mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.deleteProductFromCart("riccardoo", "Samsung s20")).rejects.toThrow(err)

        })
    
    })

    describe("deleteCurrentCart method", ()=>{

        test("delete current cart succesfully", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { id: 1, customer: "riccardoo", paid: false, total: 500 });
                return {} as Database;
            });
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null);
                return {} as Database;
            });
            const check = await cartDAO.deleteCurrentCart("riccardoo");
            expect(check).toBe(true);
        })
    
        test("try to delete a non existing cart", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, undefined);
                return {} as Database;
            });
            await expect(cartDAO.deleteCurrentCart("riccardoo")).rejects.toThrow(CartNotFoundError)

        })
    
        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.deleteCurrentCart("riccardoo")).rejects.toThrow(err)

        })
    
        test("internal DB error", async()=>{
            mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, { id: 1, customer: "riccardoo", paid: false, total: 500 });
                return {} as Database;
            });
            const err = new Error("DB error")
            jest.spyOn(db, "run").mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.deleteCurrentCart("riccardoo")).rejects.toThrow(err)

        })
    
    })

    describe("deleteAllCarts method", ()=>{

        test("succesfully delete all carts", async()=>{
            mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null);
                return {} as Database;
            });
            const check = await cartDAO.deleteAllCarts();
            expect(check).toBe(true);

        })
    

        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow(err)

        })
   
    })

    describe("getAllCarts method", ()=>{

        test("get the list of all carts", async()=>{
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, samsungCartPayed)
                return {} as Database
            })
            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [{model: "Samsung s20", quantity: 1, category: Category.SMARTPHONE, sellingPrice: 500}])
                return {} as Database
            })
            const result = (await cartDAO.getAllCarts());
            expect(result).toEqual([
            new Cart("riccardoo", true, "2024-01-01", 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])])

        })
    

        test("get the list of all the carts, no carts in storage", async()=>{

            mockDBall.mockImplementationOnce((sql: any, params: any, callback: any) => {
                callback(null, [])
                return {} as Database
            })
            const result = await cartDAO.getAllCarts();
            expect(result).toEqual([]);
 
        })
        test("internal DB error", async()=>{

            const err = new Error("DB error")
            mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
                callback(err)  
                return {} as Database
            })
            await expect(cartDAO.getAllCarts()).rejects.toThrow(err)
        })
    })
})
    