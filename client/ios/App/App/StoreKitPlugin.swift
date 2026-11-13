import Capacitor
import StoreKit

// Registers the app-local StoreKit plugin (no third-party IAP dependency).
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StoreKitPlugin())
    }
}

// StoreKit 2 bridge. Diamonds are credited only by the server after POST /payments/apple/verify;
// the web layer calls finish() only after that succeeds.
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unfinished", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise)
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                call.resolve(["products": products.map { ["id": $0.id, "displayPrice": $0.displayPrice] }])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"),
              let token = call.getString("appAccountToken").flatMap(UUID.init(uuidString:)) else {
            return call.reject("productId and a UUID appAccountToken are required")
        }
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    return call.reject("Product unavailable")
                }
                switch try await product.purchase(options: [.appAccountToken(token)]) {
                case .success(let result):
                    call.resolve(["state": "purchased", "signedTransaction": result.jwsRepresentation,
                                  "transactionId": String(result.unsafePayloadValue.id)])
                case .userCancelled:
                    call.resolve(["state": "cancelled"])
                case .pending:
                    call.resolve(["state": "pending"])
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func unfinished(_ call: CAPPluginCall) {
        Task {
            var transactions: [[String: String]] = []
            for await result in Transaction.unfinished {
                let tx = result.unsafePayloadValue
                transactions.append(["signedTransaction": result.jwsRepresentation, "transactionId": String(tx.id),
                                     "appAccountToken": tx.appAccountToken?.uuidString.lowercased() ?? ""])
            }
            call.resolve(["transactions": transactions])
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let id = call.getString("transactionId").flatMap(UInt64.init) else {
            return call.reject("transactionId is required")
        }
        Task {
            for await result in Transaction.unfinished where result.unsafePayloadValue.id == id {
                await result.unsafePayloadValue.finish()
            }
            call.resolve()
        }
    }
}
