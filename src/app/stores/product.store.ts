import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
    withHooks,
    withProps,
  } from "@ngrx/signals";
  import { computed } from "@angular/core";
  import { Product } from "../models/product.model";
  import { inject } from "@angular/core";
  import { rxMethod } from "@ngrx/signals/rxjs-interop";
  import { pipe, switchMap, tap } from "rxjs";
  import { ProductService } from "../services/product.service";
import { Router } from "@angular/router";

  export interface ProductsState {
    products: Product[];
    selectedProduct: Product | null;
    loading: boolean;
    error: string | null;
  }

  const initialState: ProductsState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
  };

  export const ProductStore = signalStore(
    { providedIn: "root" },
    withState(initialState),
    withProps(() => ({
      _productService: inject(ProductService),
      _router: inject(Router),
    })),
    withMethods((store) => ({
      loadProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            store._productService.getProducts().pipe(
              tap({
                next: (products) => {
                  patchState(store, { products, loading: false, error: null });
                },
                error: (error) => {
                  patchState(store, {
                    products: [],
                    loading: false,
                    error: error.message || "Failed to load products",
                  });
                },
              })
            )
          )
        )
      ),

      loadProduct: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) =>
            store._productService.getProduct(id).pipe(
              tap({
                next: (product) => {
                  patchState(store, {
                    selectedProduct: product,
                    loading: false,
                    error: null,
                  });
                },
                error: (error) => {
                  patchState(store, {
                    selectedProduct: null,
                    loading: false,
                    error: error.message || "Failed to load product",
                  });
                },
              })
            )
          )
        )
      ),

      createProduct: rxMethod<Omit<Product, "id">>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((product) =>
            store._productService.createProduct(product).pipe(
              tap({
                next: (newProduct) => {
                  newProduct.rating = { rate: 0, count : 0};
                  patchState(store, (state: ProductsState) => ({
                    products: [...state.products, newProduct],
                    loading: false,
                    error: null,
                  }));
                  store._router.navigate(['/products']);
                },
                error: (error) => {
                  patchState(store, {
                    loading: false,
                    error: error.message || "Failed to create product",
                  });
                },
              })
            )
          )
        )
      ),

      updateProduct: rxMethod<{ id: number; product: Partial<Product> }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ id, product }) =>
            store._productService.updateProduct(id, product).pipe(
              tap({
                next: (updatedProduct) => {
                  updatedProduct.rating = { rate: 3.2, count : 120}; // Fake rating as PUT API doesn't return rating...
                  patchState(store, (state: ProductsState) => ({
                    products: state.products.map((p) =>
                      p.id == id ? updatedProduct : p
                    ),
                    loading: false,
                    error: null,
                  }));
                  store._router.navigate(['/products']);
                },
                error: (error) => {
                  patchState(store, {
                    loading: false,
                    error: error.message || "Failed to update product",
                  });
                },
              })
            )
          )
        )
      ),

      deleteProduct: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) =>
            store._productService.deleteProduct(id).pipe(
              tap({
                next: () => {
                  patchState(store, (state: ProductsState) => ({
                    products: state.products.filter((p) => p.id !== id),
                    loading: false,
                    error: null,
                  }));
                  store._router.navigate(['/products']);
                },
                error: (error) => {
                  patchState(store, {
                    loading: false,
                    error: error.message || "Failed to delete product",
                  });
                },
              })
            )
          )
        )
      ),

      clearSelectedProduct() {
        patchState(store, { selectedProduct: null });
      },

      refreshCache() {
        store._productService.refreshCache();
        this.loadProducts();
      },
    })),
    withHooks({
      onInit: ({ loadProducts }) => {
        loadProducts();
      },
    })
  );
