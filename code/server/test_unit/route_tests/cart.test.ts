import { test, expect, jest } from "@jest/globals"
import request from 'supertest';
import CartController from '../../src/controllers/cartController';
import Authenticator from '../../src/routers/auth';
import { Cart, ProductInCart } from "../../src/components/cart"
import { Product, Category } from "../../src/components/product"
import dayjs from "dayjs";
import { app } from "../../index"


const baseURL = "/ezelectronics"
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

describe("CartRoutes unit test", ()=>{
  

    describe("GET /carts route", ()=>{

        test("should return 200 with an empty cart as body", async()=>{
            const tmp = new Cart("riccardoo", false, null as any, 0, [])
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(tmp)
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).get(baseURL+"/carts")
            expect(response.status).toBe(200)
            expect(response.body).toEqual(tmp)
            jest.clearAllMocks();
        })

        test("user not customer, return 401", async()=>{
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).get(baseURL+"/carts")
            expect(response.status).toBe(401)
            jest.clearAllMocks();
        })

        test("user not logged in, return 401", async()=>{
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            const response = await request(app).get(baseURL+"/carts")
            expect(response.status).toBe(401)
            jest.clearAllMocks();
        })
        
    })

    describe("POST /carts route", ()=>{

        test("should add a cart succesfully", async()=>{
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(()=>new Promise<Boolean>((resolve, reject)=>resolve(true)))
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).post(baseURL+"/carts").send({
                model: "Samsung s20",
            })
            expect(response.status).toBe(200)
            jest.clearAllMocks();
        })

        test("should return 422, model is empty string", async()=>{
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(()=>new Promise<Boolean>((resolve, reject)=>resolve(true)))
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).post(baseURL+"/carts").send({
                model: "",
            })
            expect(response.status).toBe(422)
            jest.clearAllMocks();
        })

        test("should return 422, model is not a string", async()=>{
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(()=>new Promise<Boolean>((resolve, reject)=>resolve(true)))
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).post(baseURL+"/carts").send({
                model: 123,
            })
            expect(response.status).toBe(422)
            jest.clearAllMocks();
        })

        test("should return 401, user is not a customer", async()=>{
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(()=>new Promise<Boolean>((resolve, reject)=>resolve(true)))
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).post(baseURL+"/carts").send({
                model: "Samsung s20",
            })
            expect(response.status).toBe(401)
            jest.clearAllMocks();
        })

        test("should return 401, user is not logged in", async()=>{
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(()=>new Promise<Boolean>((resolve, reject)=>resolve(true)))
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            const response = await request(app).post(baseURL+"/carts").send({
                model: "Samsung s20",
            })
            expect(response.status).toBe(401)
            jest.clearAllMocks();
        })

    })

    describe("PATCH /carts route", ()=>{

        test("should roturn 200 code, success", async()=>{

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);
            const result = await request(app).patch(baseURL+"/carts");
            expect(result.status).toBe(200);
            jest.clearAllMocks();
        })

        test("non logged in user, shoud return 401 status", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);
            const result = await request(app).patch(baseURL+"/carts");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("non customer logged user, should return 401 status", async()=>{

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not customer", status: 401 })
            })
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);
            const result = await request(app).patch(baseURL+"/carts");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })
    })

    describe("GET /carts/history route", ()=>{

        test("should return 200 status, success", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue(retval);
            const result = await request(app).get(baseURL+"/carts/history");
            expect(result.status).toBe(200);
            expect(result.body).toEqual(retval)
            jest.clearAllMocks();
        })

        test("non logged in user, shoud return 401 status", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue(retval);
            const result = await request(app).get(baseURL+"/carts/history");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("non customer logged user, should return 401 status", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not customer", status: 401 })
            })
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue(retval);
            const result = await request(app).get(baseURL+"/carts/history");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

    })

    describe("DELETE /carts/products/:model route", ()=>{

        test("should return 200, success", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
            const result = (await request(app).delete(baseURL+"/carts/products/Samsung s20"))
            expect(result.status).toBe(200);
            jest.clearAllMocks();
        })

        test("should return 401, non logged in user", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
            const result = (await request(app).delete(baseURL+"/carts/products/Samsung s20"))
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("should return 401, non customer user", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not customer", status: 401 })
            })
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
            const result = (await request(app).delete(baseURL+"/carts/products/Samsung s20"))
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("should return 404, bad parameters passed", async()=>{
            const retval = [new Cart("riccardoo", true, dayjs().format("AAAA-MM-DD"), 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts/products/")
            expect(result.status).toBe(404);
            jest.clearAllMocks();
        })

    })

    describe("DELETE /carts/current route", ()=>{

        test("should return status 200, success", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(200);
            jest.clearAllMocks();
        })

        test("should return status 401, user not logged in", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("should return status 401, user not customer", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not customer", status: 401 })
            })
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts/current");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

    })

    describe("DELETE /carts route", ()=>{

        test("should return status 200, success", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts");
            expect(result.status).toBe(200);
            jest.clearAllMocks();
        })

        test("should return status 401, user not logged in", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("should return status 401, user not customer", async()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not admin or manager", status: 401 })
            })
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
            const result = await request(app).delete(baseURL+"/carts");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

    })

    describe("GET /carts/all route", ()=>{

        test("should return status 200, success", async()=>{
            const retval = [new Cart("riccardoo", true, new Date().toISOString().split("T")[0], 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue(retval);
            const result = await request(app).get(baseURL+"/carts/all");
            expect(result.status).toBe(200);
            expect(result.body).toEqual(retval);
            jest.clearAllMocks();
        })

        test("should return status 401, non logged in user", async()=>{
            const retval = [new Cart("riccardoo", true, new Date().toISOString().split("T")[0], 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue(retval);
            const result = await request(app).get(baseURL+"/carts/all");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

        test("should return status 401, non admin or manager user", async()=>{
            const retval = [new Cart("riccardoo", true, new Date().toISOString().split("T")[0], 500, [new ProductInCart("Samsung s20", 1, Category.SMARTPHONE, 500)])]
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not admin or manager", status: 401 })
            })
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue(retval);
            const result = await request(app).get(baseURL+"/carts/all");
            expect(result.status).toBe(401);
            jest.clearAllMocks();
        })

    })

})