import AuthenticationServices
import Capacitor
import UIKit

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var pending: (call: CAPPluginCall, controller: ASAuthorizationController, anchor: WindowAnchor)?

    @objc func authorize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.pending == nil else {
                return call.reject("Apple sign-in is already in progress.")
            }
            guard let window = self.bridge?.viewController?.viewIfLoaded?.window else {
                return call.reject("Apple sign-in could not find the active window.")
            }

            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email, .fullName]
            let controller = ASAuthorizationController(authorizationRequests: [request])
            let anchor = WindowAnchor(window: window)
            controller.delegate = self
            controller.presentationContextProvider = anchor
            self.pending = (call, controller, anchor)
            controller.performRequests()
        }
    }

    public func authorizationController(_ controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let pending, pending.controller === controller else { return }
        self.pending = nil

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let data = credential.identityToken,
              let identityToken = String(data: data, encoding: .utf8), !identityToken.isEmpty else {
            return pending.call.reject("Apple sign-in did not return an identity token.")
        }

        var result = ["identityToken": identityToken, "user": credential.user]
        result["email"] = credential.email
        result["givenName"] = credential.fullName?.givenName
        result["familyName"] = credential.fullName?.familyName
        pending.call.resolve(result)
    }

    public func authorizationController(_ controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let pending, pending.controller === controller else { return }
        self.pending = nil

        if (error as? ASAuthorizationError)?.code == .canceled {
            pending.call.reject("Apple sign-in cancelled.", "APPLE_SIGN_IN_CANCELLED")
        } else {
            pending.call.reject(error.localizedDescription)
        }
    }
}

private final class WindowAnchor: NSObject, ASAuthorizationControllerPresentationContextProviding {
    let window: ASPresentationAnchor

    init(window: ASPresentationAnchor) {
        self.window = window
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        window
    }
}
