import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap, catchError, EMPTY, finalize } from 'rxjs';
import { Product } from '../models/product.model';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);

  private apiUrl = 'https://fakestoreapi.com/products';
  //private productsCache$: Observable<Product[]> | null = null;
  private readonly CACHE_KEY_ALL = 'all_products';
  private readonly CACHE_KEY_PREFIX = 'product_';

  readonly #products = signal<Product[]>([]);
  readonly #selectedProduct = signal<Product | null>(null);
  readonly #error = signal<string | null>(null);
  readonly #loading = signal<boolean>(false);

  public readonly products = this.#products.asReadonly();
  public readonly selectedProduct = this.#selectedProduct.asReadonly();
  public readonly error = this.#error.asReadonly();
  public readonly loading = this.#loading.asReadonly();


  getProducts(): void {
    // Check memory cache first
    if (this.#products().length > 0) {
      return;
    }

    // Check persistent cache
    const cachedData = this.cacheService.get(this.CACHE_KEY_ALL) as Product[] | null;
    if (cachedData) {
      this.#products.set(cachedData);
      return;
    }

    this.#loading.set(true);
    this.http
      .get<Product[]>(this.apiUrl)
      .pipe(
        tap((products) => {
          this.#products.set(products);
          this.cacheService.set(this.CACHE_KEY_ALL, products);
        }),
        catchError((error) => {
          this.#error.set(error.message || "Failed to load products");
          return EMPTY;
        }),
        finalize(() => this.#loading.set(false))
      )
      .subscribe();
  }

  getProduct(id: number): void {
    // Check persistent cache
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
    const cachedProduct = this.cacheService.get(cacheKey) as Product | null;
    if (cachedProduct) {
      this.#selectedProduct.set(cachedProduct);
      return;
    }

    this.#loading.set(true);
    this.http.get<Product>(`${this.apiUrl}/${id}`)
    .pipe(
      tap(product => {
        this.#selectedProduct.set(product);
        this.cacheService.set(cacheKey, product);
      }),
      catchError((error) => {
        this.#error.set(error.message || "Failed to load product");
        return EMPTY;
      }),
      finalize(() => this.#loading.set(false))
    ).subscribe();
  }

  // getProducts(): Observable<Product[]> {
  //   // Check memory cache first
  //   if (this.productsCache$) {
  //     return this.productsCache$;
  //   }

  //   // Check persistent cache
  //   const cachedData = this.cacheService.get(this.CACHE_KEY_ALL);
  //   if (cachedData) {
  //     return of(cachedData);
  //   }

  //   // If no cache, fetch from API and cache the result
  //   this.productsCache$ = this.http.get<Product[]>(this.apiUrl).pipe(
  //     tap(products => this.cacheService.set(this.CACHE_KEY_ALL, products)),
  //     shareReplay(1),
  //     catchError(error => {
  //       this.productsCache$ = null;
  //       throw error;
  //     })
  //   );

  //   return this.productsCache$;
  // }

  // getProduct(id: number): Observable<Product> {
  //   const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

  //   // Check persistent cache
  //   const cachedProduct = this.cacheService.get(cacheKey);
  //   if (cachedProduct) {
  //     return of(cachedProduct);
  //   }

  //   return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
  //     tap(product => this.cacheService.set(cacheKey, product)),
  //     catchError(error => {
  //       throw error;
  //     })
  //   );
  // }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }

  private invalidateCache(): void {
    this.#products.set([]);
    //this.productsCache$ = null;
    this.cacheService.clear();
  }

  refreshCache(): void {
    this.invalidateCache();
    this.getProducts();
  }

  clearSelectedProduct(): void {
    this.#selectedProduct.set(null);
  }
}