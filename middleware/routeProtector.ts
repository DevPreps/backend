/*
    This route level middleware defines a set of protections which can be applied to routes
    to define the access rights required to access them.

    Usage:
    This middleware should be applied to all routes that require access protection. This
    middleware takes a single argument, which is an object containing the specific protections
    to apply for the given route. The object can contain the following properties:
        - authorisedRoles: An array of roles that are authorised to access the route.
        - loggedIn: A boolean value. True passes the check only when the user is logged in. 
            False passes the check only when the user is not logged in. If this property 
            is not present, the check always passes.

    Any property not defined in the object will be ignored.

    The following example defines a route that requires the user to be logged in and to have the role 'ADMIN' to access it:

        router.route("/admin")
            .get(
                protect(
                    {
                        loggedIn: true,
                        authorisedRoles: ["ADMIN"]
                    }
                ),
                validate(someAdminValidator),
                someAdminRouteHandler()
            );
*/

import { RequestHandler, Request, Response, NextFunction } from "express"; // TypeScript types

const protect =
    (protections: Protections): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
        if (protections.loggedIn !== undefined) {
            if (!loginCheck(req, protections.loggedIn)) {
                return res.status(401).json({
                    status: "error",
                    message: "You must be logged in to access this service",
                });
            }
        }
        return next();
    };

export default protect;

// Logged in check
// If loggedIn is true, checks if user is logged in
// If loggedIn is false, checks if user is not logged in
const loginCheck = (req: Request, loggedIn: boolean): boolean => {
    return (!!req.session.user && !!req.session.loggedIn) === loggedIn;
};

// Define the interface for the protections object
interface Protections {
    loggedIn?: boolean;
}
