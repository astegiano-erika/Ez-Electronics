import { test, expect, jest } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Product, Category } from "../../src/components/product"
import { User, Role } from "../../src/components/user"
import dayjs from "dayjs";
import {CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError} from "../../src/errors/cartError"
import  { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError"

jest.mock("../../src/dao/cartDAO")

//verifica che un utente possa aggiungere un prodotto al proprio carrello
test("aggiunta prodotto al carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const testProduct = "Hp v10"
    const controller = new CartController()
    jest.spyOn(CartDAO.prototype, "addProductToCart").mockResolvedValueOnce(true);
    const response = await controller.addToCart(testUser, testProduct)
    expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledWith(testUser.username, testProduct)
    expect(response).toBe(true);
    jest.clearAllMocks();
})

//verifica che un utente non possa aggiungere un prodotto inesistente al carrello
test("aggiunta prodotto inesistente al carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const testProduct = "non existing product"
    jest.spyOn(CartDAO.prototype, "addProductToCart").mockRejectedValueOnce(new ProductNotFoundError());
    const controller = new CartController()
    await expect(controller.addToCart(testUser, testProduct)).rejects.toThrow(ProductNotFoundError)
    expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledWith(testUser.username, testProduct)
    jest.clearAllMocks();
})

//verifica che un utente non possa aggiungere un prodotto non disponibile (quantità = 0) al proprio carrello
test("aggiunta prodotto non disponibile al carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const testProduct = "Asus v11"
    jest.spyOn(CartDAO.prototype, "addProductToCart").mockResolvedValueOnce(true)
    jest.spyOn(CartDAO.prototype, "addProductToCart").mockRejectedValueOnce(new EmptyProductStockError());
    const controller = new CartController()
    await controller.addToCart(testUser, testProduct);
    await expect(controller.addToCart(testUser, testProduct)).rejects.toThrow(EmptyProductStockError)
    expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledTimes(2);
    expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledWith(testUser.username, testProduct)
    jest.clearAllMocks();
})

//verifica che sia ritornato il carrello dell'utente
test("ottenimento del carrello di un utente", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const expectedResult = new Cart("agnesee", false, "", 300, [new ProductInCart("Hp v10", 1, Category.LAPTOP, 300)])
    jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(expectedResult);
    const controller = new CartController()
    const response = await controller.getCart(testUser);
    expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(testUser.username);
    expect(response).toBe(expectedResult);
    jest.clearAllMocks();
})

//verifica che avvenga il pagamento del carrello
test("pagamento carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    jest.spyOn(CartDAO.prototype, "payCurrentCart").mockResolvedValueOnce(true);
    const controller = new CartController()
    const response = await controller.checkoutCart(testUser)
    expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledTimes(1)
    expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledWith(testUser.username, new Date().toISOString().split("T")[0])
    expect(response).toBe(true)
    jest.clearAllMocks();
})

//verifica che ci sia un errore nel pagare un carrello vuoto e che venga lanciato il giusto errore
test("pagamento carrello vuoto", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const prod = "Hp v10"
    jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockResolvedValueOnce(true);
    jest.spyOn(CartDAO.prototype, "payCurrentCart").mockRejectedValueOnce(new EmptyCartError())
    const controller = new CartController()
    await controller.removeProductFromCart(testUser, prod)
    await expect(controller.checkoutCart(testUser)).rejects.toThrow(EmptyCartError)
    expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledTimes(1)
    expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledWith(testUser.username, new Date().toISOString().split("T")[0])
    jest.clearAllMocks();
})

//carrello non trovato durante il pagamento
test("carrello non trovato durante pagamento", async()=>{
    const testUser = new User("badBoy", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    jest.spyOn(CartDAO.prototype, "payCurrentCart").mockRejectedValueOnce(new CartNotFoundError())
    const controller = new CartController()
    await expect(controller.checkoutCart(testUser)).rejects.toThrow(CartNotFoundError)
    expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledTimes(1)
    expect(CartDAO.prototype.payCurrentCart).toHaveBeenCalledWith(testUser.username, new Date().toISOString().split("T")[0])
    jest.clearAllMocks();
})

//verifica della funzione di getCustomerCarts
test("lista dei cart di un utente", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const result = [new Cart("agnesee", true, "2024-05-28", 600, [new ProductInCart("Hp v10", 2, Category.LAPTOP, 300)])]
    jest.spyOn(CartDAO.prototype, "getHistoryCart").mockResolvedValueOnce(result);
    const controller = new CartController();
    const response = await controller.getCustomerCarts(testUser);
    expect(CartDAO.prototype.getHistoryCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.getHistoryCart).toHaveBeenCalledWith(testUser.username);
    expect(response).toBe(result);
    jest.clearAllMocks();
})

//rimozione prodotto dal carrello
test("rimozione prodotto dal carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const testProduct = "Hp v10"
    jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockResolvedValueOnce(true);
    const controller = new CartController();
    const response = await controller.removeProductFromCart(testUser, testProduct);
    expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenLastCalledWith(testUser.username, testProduct);
    expect(response).toBe(true);
    jest.clearAllMocks();
})

//rimozione prodotto che non esiste dal carrello
test("rimozione prodotto inesistente dal carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const testProduct = "not existing product"
    jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockRejectedValueOnce(new ProductNotFoundError());
    const controller = new CartController();
    await expect(controller.removeProductFromCart(testUser, testProduct)).rejects.toThrow(ProductNotFoundError)
    expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenLastCalledWith(testUser.username, testProduct);
    jest.clearAllMocks();
})

//rimozione prodotto non presente nel carrello
test("rimozione prodotto non presente nel carrello", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    const testProduct = "Samsung v11"
    jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());
    const controller = new CartController();
    await expect(controller.removeProductFromCart(testUser, testProduct)).rejects.toThrow(ProductNotInCartError)
    expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.deleteProductFromCart).toHaveBeenLastCalledWith(testUser.username, testProduct);
    jest.clearAllMocks();
})


//clear del carrello corrente
test("rimozione di tutti i prodotti dal carrello corrente di un utente", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    jest.spyOn(CartDAO.prototype, "deleteCurrentCart").mockResolvedValueOnce(true);
    const controller = new CartController();
    const response = await controller.clearCart(testUser);
    expect(CartDAO.prototype.deleteCurrentCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.deleteCurrentCart).toHaveBeenCalledWith(testUser.username)
    expect(response).toBe(true)
    jest.clearAllMocks()
})

//tentativo di clear del carrello corrente, che però non esiste
test("clear carrello inesistente", async()=>{
    const testUser = new User("agnesee", "whatever", "whatever", Role.CUSTOMER, "whatever", "whatever")
    jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true)
    jest.spyOn(CartDAO.prototype, "deleteCurrentCart").mockRejectedValueOnce(new CartNotFoundError());
    const controller = new CartController();
    await expect(controller.clearCart(testUser)).rejects.toThrow(CartNotFoundError);
    expect(CartDAO.prototype.deleteCurrentCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.deleteCurrentCart).toHaveBeenCalledWith(testUser.username)
    jest.clearAllMocks()
})
