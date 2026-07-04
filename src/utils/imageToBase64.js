export async function imagemParaBase64(url) {
  try {
    const resposta = await fetch(url)
    const blob = await resposta.blob()
    return await new Promise((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onloadend = () => resolve(leitor.result)
      leitor.onerror = reject
      leitor.readAsDataURL(blob)
    })
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.error('Não foi possível carregar a imagem para o PDF:', erro)
    return null
  }
}
