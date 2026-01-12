import { test, expect, jest, beforeAll, afterAll, beforeEach, afterEach, describe} from "@jest/globals"
import request from 'supertest';
import express, { response } from 'express';
import CartController from '../../src/controllers/cartController';
import CartRoutes from '../../src/routers/cartRoutes';
import Authenticator from '../../src/routers/auth';
import ErrorHandler from '../../src/helper';
import { Cart, ProductInCart } from "../../src/components/cart"
import { Product, Category } from "../../src/components/product"
import { User, Role } from "../../src/components/user"
import dayjs from "dayjs";
import { app } from "../../index"
import CartDAO from "../../src/dao/cartDAO"
import UserDAO from "../../src/dao/userDAO"
import ProductDAO from "../../src/dao/productDAO"

jest.setTimeout(200000);
import {CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError} from "../../src/errors/cartError"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError"

const baseURL = "/ezelectronics"
const userDAO = new UserDAO();
const cartDAO = new CartDAO();
const productDAO = new ProductDAO();

jest.mock("../../src/routers/auth")

describe("Cart integrated test", ()=>{

    beforeAll(async()=>{
        await cartDAO.deleteAllCarts();
        await userDAO.deleteAllUsers();
        await productDAO.deleteProducts();
    })

    describe("Query from a customer logged in user", ()=>{

        beforeAll(async()=>{

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
                req.user = {username: "riccardoo", role: Role.CUSTOMER}
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next)=>res.status(401).json({error: "user not admin or manager"}))
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next)=>next())
            await userDAO.createUser("riccardoo", "riccardo", "freddolino", "1234", Role.CUSTOMER)
            await productDAO.registerProduct("Samsung s20", Category.SMARTPHONE, 500, "latest model", 5, new Date().toISOString().split("T")[0])
            await productDAO.registerProduct("Iphone X", Category.SMARTPHONE, 500, "latest model", 5, new Date().toISOString().split("T")[0])
            await cartDAO.addProductToCart("riccardoo", "Samsung s20")
        })

        afterAll(async()=>{
            await cartDAO.deleteAllCarts();
            await userDAO.deleteAllUsers();
            await productDAO.deleteProducts();
            jest.clearAllMocks();
        })

        test("get cart, success", async()=>{
            const response = await request(app).get(baseURL+"/carts");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(new Cart("riccardoo", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)]))
        })

        test("add porduct to cart, success", async()=>{
            await cartDAO.deleteAllCarts();
            const response = await request(app).post(baseURL+"/carts").send({
                model: "Samsung s20",
            })
            expect(response.status).toBe(200)
            const check = await request(app).get(baseURL+"/carts");
            expect(check.status).toBe(200);
            expect(check.body).toEqual(new Cart("riccardoo", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)]))
        })

        test("add porduct to cart, empty string as model, fail", async()=>{
            const response = await request(app).post(baseURL+"/carts").send({
                model: "",
            })
            expect(response.status).toBe(422)
            const check = await request(app).get(baseURL+"/carts");
            expect(check.status).toBe(200);
            expect(check.body).toEqual(new Cart("riccardoo", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)]))
        })

        test("add porduct to cart, non existing model, fail", async()=>{
            const response = await request(app).post(baseURL+"/carts").send({
                model: "non existing model",
            })
            expect(response.status).toBe(404)
            const check = await request(app).get(baseURL+"/carts");
            expect(check.status).toBe(200);
            expect(check.body).toEqual(new Cart("riccardoo", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)]))
        })

        test("checkOut cart, success", async()=>{
            const response = await request(app).patch(baseURL+"/carts");
            expect(response.status).toBe(200);
            const check = await cartDAO.getAllCarts()
            expect(check).toEqual([new Cart("riccardoo", true, new Date().toISOString().split("T")[0] as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])])
        })

        test("checkOut cart, non existing cart, fail", async()=>{
            const response = await request(app).patch(baseURL+"/carts");
            expect(response.status).toBe(404);
        })

        test("checkOut cart, empty cart, fail", async()=>{
            await cartDAO.addProductToCart("riccardoo", "Samsung s20");
            await cartDAO.deleteProductFromCart("riccardoo", "Samsung s20")
            const response = await request(app).patch(baseURL+"/carts");
            expect(response.status).toBe(400);
            await cartDAO.deleteAllCarts();
            await cartDAO.addProductToCart("riccardoo", "Samsung s20") //rebuild the cart database for the next tests
        })

        test("history carts of user, success, empty array", async()=>{
            const response = await request(app).get(baseURL+"/carts/history");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([])
        })

        test("get history carts of user, success, cart returned", async()=>{
            await cartDAO.payCurrentCart("riccardoo", new Date().toISOString().split("T")[0]);
            const response = await request(app).get(baseURL+"/carts/history");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([new Cart("riccardoo", true, new Date().toISOString().split("T")[0] as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])])
            await cartDAO.addProductToCart("riccardoo", "Samsung s20") //rebuild the cart database for the next tests
        })

        test("delete product from cart, success", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next)=>{
                req.user = {username: "riccardoo", role: Role.CUSTOMER}
                req.params = {model: "Samsung s20"}
                return next();
            })
            const result = await request(app).delete(baseURL+"/carts/products/:model");
            expect(result.status).toBe(200);
            const check = await cartDAO.getCurrentCart("riccardoo")
            expect(check).toEqual(new Cart("riccardoo", false, null as any, 0, []))
        })

        test("delete product from cart but product is not in cart, fail", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next)=>{
                req.user = {username: "riccardoo", role: Role.CUSTOMER}
                req.params = {model: "Samsung s20"}
                return next();
            })
            const result = await request(app).delete(baseURL+"/carts/products/:model");
            expect(result.status).toBe(404);
        })

        test("delete product from cart but product does not exist, fail", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next)=>{
                req.user = {username: "riccardoo", role: Role.CUSTOMER}
                req.params = {model: "non existing product"}
                return next();
            })
            const result = await request(app).delete(baseURL+"/carts/products/:model");
            expect(result.status).toBe(404);
        })

        test("delete product from cart but product is an empty string, fail", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next)=>{
                req.user = {username: "riccardoo", role: Role.CUSTOMER}
                req.params = {model: ""}
                return next();
            })
            const result = await request(app).delete(baseURL+"/carts/products/:model");
            expect(result.status).toBe(422);
        })

        test("delete all products from current cart, success", async()=>{
            await cartDAO.addProductToCart("riccardoo", "Samsung s20");
            await cartDAO.addProductToCart("riccardoo", "Iphone X");
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(200);
            const check = await request(app).get(baseURL+"/carts");
            expect(check.body).toEqual(new Cart("riccardoo", false, null as any, 0, []))
        })

        test("delete al products from cart but cart does not exist, fail", async()=>{
            await cartDAO.deleteAllCarts();
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(404);
            const check = await request(app).get(baseURL+"/carts");
            expect(check.body).toEqual(new Cart("riccardoo", false, null as any, 0, []))
            await cartDAO.addProductToCart("riccardoo", "Samsung s20")//restore database for next tests
        })

        test("delete all carts, user is not manager or admin, fail", async()=>{
            const result = await request(app).delete(baseURL+"/carts");
            expect(result.status).toBe(401);
            const check = await cartDAO.getAllCarts();
            expect(check).toEqual([new Cart("riccardoo", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])])
        })

        test("get all carts, user is not admin or manager, fail", async()=>{
            const result = await request(app).get(baseURL+"/carts/all");
            expect(result.status).toBe(401);
            expect(result.body).toEqual({error: "user not admin or manager"})
        })
    
    })

    describe("user is logged in and is manager or admin", ()=>{

        beforeAll(async()=>{

            await cartDAO.deleteAllCarts();
            await userDAO.deleteAllUsers();
            await productDAO.deleteProducts();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
                req.user = {username: "riccardoo", role: Role.MANAGER}
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next)=>next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next)=>res.status(401).json({error: "user not customer"}))
            await userDAO.createUser("emanuelee", "emanuele", "frisi", "1234", Role.CUSTOMER)
            await userDAO.createUser("riccardoo", "riccardo", "freddolino", "1234", Role.MANAGER)
            await productDAO.registerProduct("Samsung s20", Category.SMARTPHONE, 500, "latest model", 5, new Date().toISOString().split("T")[0])
            await productDAO.registerProduct("Iphone X", Category.SMARTPHONE, 500, "latest model", 5, new Date().toISOString().split("T")[0])
            await cartDAO.addProductToCart("emanuelee", "Samsung s20");
        })

        afterAll(async()=>{
            await cartDAO.deleteAllCarts();
            await userDAO.deleteAllUsers();
            await productDAO.deleteProducts();
            jest.clearAllMocks();
        })

        test("get user cart, but user is manager or admin, fail", async()=>{
            const result = await request(app).get(baseURL+"/carts");
            expect(result.status).toBe(401);
        })

        test("add product to cart, but user is manager or admin, fail", async()=>{
            const result = await request(app).post(baseURL+"/carts");
            expect(result.status).toBe(401);
        })

        test("checkout cart, but user is manager or admin, fail", async()=>{
            const result = await request(app).patch(baseURL+"/carts");
            expect(result.status).toBe(401);
        })

        test("get user cart history, but user is manager or admin, fail", async()=>{
            const result = await request(app).get(baseURL+"/carts/history");
            expect(result.status).toBe(401);
        })

        test("remove product from cart, but user is manager or admin, fail", async()=>{
            const result = await request(app).delete(baseURL+"/carts/products/:model");
            expect(result.status).toBe(401);
        })

        test("delete current cart, but user is manager or admin, fail", async()=>{
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(401);
        })

        test("get all the carts, success", async()=>{
            const result = await request(app).get(baseURL+"/carts/all");
            expect(result.status).toBe(200);
            expect(result.body).toEqual([new Cart("emanuelee", false, null as any, 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])])
        })

        test("delete all the carts, success", async()=>{
            const result = await request(app).delete(baseURL+"/carts");
            expect(result.status).toBe(200);
            const check = await request(app).get(baseURL+"/carts/all");
            expect(check.body).toEqual([])
        })

    })

    describe("user not logged in", ()=>{

        beforeAll(async()=>{

            await cartDAO.deleteAllCarts();
            await userDAO.deleteAllUsers();
            await productDAO.deleteProducts();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next)=>{
                return res.status(401).json({error: "user not logged in"})
            })
        })

        afterAll(async()=>{
            await cartDAO.deleteAllCarts();
            await userDAO.deleteAllUsers();
            await productDAO.deleteProducts();
            jest.clearAllMocks();
        })

        test("get user cart, but user is not logged in, fail", async()=>{
            const result = await request(app).get(baseURL+"/carts");
            expect(result.status).toBe(401);
        })

        test("add product to cart, but user is not logged in, fail", async()=>{
            const result = await request(app).post(baseURL+"/carts");
            expect(result.status).toBe(401);
        })

        test("checkout cart, but user is not logged in, fail", async()=>{
            const result = await request(app).patch(baseURL+"/carts");
            expect(result.status).toBe(401);
        })

        test("get user cart history, but user is not logged in, fail", async()=>{
            const result = await request(app).get(baseURL+"/carts/history");
            expect(result.status).toBe(401);
        })

        test("remove product from cart, but user is not logged in, fail", async()=>{
            const result = await request(app).delete(baseURL+"/carts/products/:model");
            expect(result.status).toBe(401);
        })

        test("delete current cart, but user is not logged in, fail", async()=>{
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(401);
        })

        test("get all the carts, but user is not logged in, fail", async()=>{
            const result = await request(app).get(baseURL+"/carts/all");
            expect(result.status).toBe(401);
        })

        test("delete all the carts, but user is not logged in, fail", async()=>{
            const result = await request(app).delete(baseURL+"/carts");
            expect(result.status).toBe(401);
        })
    })

})
