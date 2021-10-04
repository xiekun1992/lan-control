declare namespace LAN {
  interface AppModule {
    init()
    destroy()
  }
  type Nullable<T> = T | null | undefined
}