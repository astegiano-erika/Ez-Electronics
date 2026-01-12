import express, { Router } from "express"
import Authenticator from "./auth"
import { body, check, param, query } from "express-validator"
import { User } from "../components/user"
import ErrorHandler from "../helper"
import UserController from "../controllers/userController"
import seedController from "../controllers/seeder"

/**
 * Represents a class that defines the routes for handling users.
 */
class UserRoutes {
    private router: Router
    private authService: Authenticator
    private errorHandler: ErrorHandler
    private controller: UserController
    private seed: seedController

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.controller = new UserController()
        this.seed= new seedController()
        this.initRoutes()
    }

    /**
     * Get the router instance.
     * @returns The router instance.
     */
    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the routes for the user router.
     * 
     * @remarks
     * This method sets up the HTTP routes for creating, retrieving, updating, and deleting user data.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     */
    initRoutes() {

        const regex = /^\d{4}-\d{2}-\d{2}$/;
        const currentDate = new Date();

        const checkUsername = check('username').notEmpty().isString().withMessage('Username has to be a string and cannot be empty');
        const checkPassword = check('password').notEmpty().isString().withMessage('Password has to be a string and cannot be empty');
        const checkAddress = check('address').notEmpty().isString().withMessage('Address has to be a string and cannot be empty');
        const checkName = check('name').notEmpty().isString().withMessage('Name has to be a string and cannot be empty');
        const checkSurname = check('surname').notEmpty().isString().withMessage('Surname has to be a string and cannot be empty');
        const checkRole = check('role').notEmpty().isString().withMessage('Role has to be a string and cannot be empty')
                                                .isIn(["Customer", "Admin", "Manager"]).withMessage('Role is not Manger, Customer, Admin');
        const checkBirthdate = check('birthdate').notEmpty().isString().withMessage('Birthdate has to be a string and cannot be empty')
                                                .matches(regex).withMessage('Birthdate must be in the format yyyy-mm-dd')
                                                .custom((value: any)=>{
                                                    if (!regex.test(value)) return Promise.reject("date format must be YYYY-MM-DD")
                                                    if (currentDate < new Date(value)) return Promise.reject("date must be before the current date")
                                                    return Promise.resolve();
                                                });
        

/*         this.router.get(
            "/seed",
            (req: any, res: any, next: any) => this.seed.seedUsers()
                .then(()=> res.status(200).end()) 
                .catch((err => console.log(err)))
        ) */

        /**
         * Route for creating a user.
         * It does not require authentication.
         * It requires the following body parameters:
         * - username: string. It cannot be empty and it must be unique (an existing username cannot be used to create a new user)
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - password: string. It cannot be empty.
         * - role: string (one of "Manager", "Customer", "Admin")
         * It returns a 200 status code.
         */
        this.router.post(
            "/",[
                checkUsername,
                checkName,
                checkSurname,
                checkPassword,
                checkRole,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.createUser(req.body.username, req.body.name, req.body.surname, req.body.password, req.body.role)
                .then(() => res.status(200).end())
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all users.
         * It requires the user to be logged in and to be an admin.
         * It returns an array of users.
         */
        this.router.get(
            "/",[
                this.authService.isLoggedIn,
                this.authService.isAdmin,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.getUsers()
                .then((users: any /**User[] */) => res.status(200).json(users))
                .catch((err) => next(err))
        )


        /**
         * Route for retrieving all users of a specific role.
         * It requires the user to be logged in and to be an admin.
         * It expects the role of the users in the request parameters: the role must be one of ("Manager", "Customer", "Admin").
         * It returns an array of users.
         */
        this.router.get(
            "/roles/:role",[
                this.authService.isLoggedIn,
                this.authService.isAdmin,
                checkRole,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.getUsersByRole(req.params.role)
                .then((users: any /**User[] */) => res.status(200).json(users))
                .catch((err) => next(err))
        )

        /**
         * Route for retrieving a user by its username.
         * It requires the user to be authenticated: users with an Admin role can retrieve data of any user, users with a different role can only retrieve their own data.
         * It expects the username of the user in the request parameters: the username must represent an existing user.
         * It returns the user.
         */
        this.router.get(
            "/:username",[
                checkUsername,
                this.authService.isLoggedIn,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.getUserByUsername(req.user, req.params.username)
                .then((user: any /**User */) => res.status(200).json(user))
                .catch((err) => next(err))
        )

        /**
         * Route for deleting a user.
         * It requires the user to be authenticated: users with an Admin role can delete the data of any user (except other Admins), users with a different role can only delete their own data.
         * It expects the username of the user in the request parameters: the username must represent an existing user.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:username",[
                checkUsername,
                this.authService.isLoggedIn,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.deleteUser(req.user, req.params.username)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for deleting all users.
         * It requires the user to be logged in and to be an admin.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",[
                this.authService.isLoggedIn,
                this.authService.isAdmin,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.deleteAll()
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for updating the information of a user.
         * It requires the user to be authenticated.
         * It expects the username of the user to edit in the request parameters: if the user is not an Admin, the username must match the username of the logged in user. Admin users can edit other non-Admin users.
         * It requires the following body parameters:
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - address: string. It cannot be empty.
         * - birthdate: date. It cannot be empty, it must be a valid date in format YYYY-MM-DD, and it cannot be after the current date
         * It returns the updated user.
         */
        this.router.patch(
            "/:username",[
                checkName,
                checkSurname,
                checkAddress,
                checkBirthdate,
                this.authService.isLoggedIn,
                this.errorHandler.validateRequest
            ],
            (req: any, res: any, next: any) => this.controller.updateUserInfo(req.user, req.body.name, req.body.surname, req.body.address, req.body.birthdate, req.params.username)
                .then((user: any /**User */) => res.status(200).json(user))
                .catch((err: any) => next(err))
        )

    }
}

/**
 * Represents a class that defines the authentication routes for the application.
 */
class AuthRoutes {
    private router: Router
    private errorHandler: ErrorHandler
    private authService: Authenticator

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator - The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.errorHandler = new ErrorHandler()
        this.router = express.Router();
        this.initRoutes();
    }

    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the authentication routes.
     * 
     * @remarks
     * This method sets up the HTTP routes for login, logout, and retrieval of the logged in user.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     */
    initRoutes() {

        /**
         * Route for logging in a user.
         * It does not require authentication.
         * It expects the following parameters:
         * - username: string. It cannot be empty.
         * - password: string. It cannot be empty.
         * It returns an error if the username represents a non-existing user or if the password is incorrect.
         * It returns the logged in user.
         */
        this.router.post(
            "/",
            (req, res, next) => this.authService.login(req, res, next)
                .then((user: User) => res.status(200).json(user))
                .catch((err: any) => { res.status(401).json(err) })
        )

        /**
         * Route for logging out the currently logged in user.
         * It expects the user to be logged in.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/current",
            (req, res, next) => this.authService.logout(req, res, next)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for retrieving the currently logged in user.
         * It expects the user to be logged in.
         * It returns the logged in user.
         */
        this.router.get(
            "/current",
            (req: any, res: any) => res.status(200).json(req.user)
        )
    }
}

export { UserRoutes, AuthRoutes }